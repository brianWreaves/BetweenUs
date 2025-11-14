import type {
  SpeechErrorListener,
  SpeechResultListener,
  SpeechService,
  SpeechStopListener,
} from "./service";

type DeepgramTranscriptionEvent = {
  channel: {
    alternatives: Array<{
      transcript: string;
      confidence?: number;
      words?: Array<{
        word: string;
        start: number;
        end: number;
        confidence?: number;
      }>;
    }>;
  };
  is_final: boolean;
};

type DeepgramSocket = WebSocket & {
  addEventListener(
    type: "message",
    listener: (event: MessageEvent<string>) => void,
  ): void;
};

export type DeepgramSpeechOptions = {
  getSocketUrl: () => Promise<string>;
};

type AudioContextConstructor = typeof AudioContext;

type ExtendedWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

export class DeepgramSpeechService implements SpeechService {
  private readonly options: DeepgramSpeechOptions;
  private socket: DeepgramSocket | null = null;
  private audioStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private audioProcessor: ScriptProcessorNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private readonly targetSampleRate = 16_000;
  private keepAliveTimer: number | null = null;

  private resultListeners = new Set<SpeechResultListener>();
  private errorListeners = new Set<SpeechErrorListener>();
  private stopListeners = new Set<SpeechStopListener>();

  constructor(options: DeepgramSpeechOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.socket) {
      return;
    }

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Media devices unavailable in this environment.");
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    const socketUrl = await this.options.getSocketUrl();
    const socket = await this.createSocket(socketUrl);
    this.socket = socket;
    this.audioStream = stream;

    await this.startPcmProcessor(stream);

    socket.addEventListener("open", () => {
      this.startKeepAlive();
    });

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as DeepgramTranscriptionEvent;
        if (!payload.channel) {
          return;
        }
        const transcript =
          payload.channel.alternatives[0]?.transcript?.trim() ?? "";
        if (!transcript) {
          return;
        }
        this.emitResult({
          text: transcript,
          final: Boolean(payload.is_final),
        });
      } catch (error) {
        this.emitError(
          error instanceof Error ? error : new Error("Invalid Deepgram data"),
        );
      }
    });

    socket.addEventListener("close", (event) => {
      const friendlyError = this.describeCloseEvent(event);
      if (friendlyError) {
        this.emitError(friendlyError);
      }
      this.emitStop();
      this.reset();
    });

    socket.addEventListener("error", () => {
      this.emitError(new Error("Deepgram socket error"));
    });

    // PCM streaming begins via the audio processor inside startPcmProcessor
  }

  async stop(): Promise<void> {
    this.sendSocketMessage({ type: "CloseStream" });
    this.reset();
    this.emitStop();
  }

  onResult(listener: SpeechResultListener): () => void {
    this.resultListeners.add(listener);
    return () => this.resultListeners.delete(listener);
  }

  onError(listener: SpeechErrorListener): () => void {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  onStop(listener: SpeechStopListener): () => void {
    this.stopListeners.add(listener);
    return () => this.stopListeners.delete(listener);
  }

  private async createSocket(url: string): Promise<DeepgramSocket> {
    return new Promise<DeepgramSocket>((resolve, reject) => {
      const socket = new WebSocket(url) as DeepgramSocket;

      socket.addEventListener("open", () => resolve(socket));
      socket.addEventListener("error", (event) => {
        reject(
          event instanceof ErrorEvent
            ? event.error
            : new Error("Failed to open Deepgram connection"),
        );
      });
    });
  }

  private sendSocketMessage(message: unknown) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    this.socket.send(JSON.stringify(message));
  }

  private reset() {
    this.teardownAudioProcessing();
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
    this.stopKeepAlive();
    if (this.socket) {
      try {
        this.socket.close();
      } catch {
        /* noop */
      }
      this.socket = null;
    }
  }

  private emitResult(result: { text: string; final: boolean }) {
    for (const listener of this.resultListeners) {
      listener(result);
    }
  }

  private emitError(error: Error) {
    for (const listener of this.errorListeners) {
      listener(error);
    }
  }

  private emitStop() {
    for (const listener of this.stopListeners) {
      listener();
    }
  }

  private async startPcmProcessor(stream: MediaStream) {
    if (typeof window === "undefined") {
      throw new Error("AudioContext unavailable in this environment.");
    }
    const contextCtor =
      window.AudioContext ??
      (window as ExtendedWindow).webkitAudioContext ??
      null;
    if (!contextCtor) {
      throw new Error("Web Audio API is not supported in this browser.");
    }
    const audioContext = new contextCtor();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    processor.onaudioprocess = (event) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }
      const input = event.inputBuffer.getChannelData(0);
      if (!input) {
        return;
      }
      const downsampled = this.downsampleBuffer(
        input,
        audioContext.sampleRate,
        this.targetSampleRate,
      );
      if (!downsampled || downsampled.length === 0) {
        return;
      }
      const pcmBuffer = this.floatTo16BitPCM(downsampled);
      this.socket.send(pcmBuffer);
    };
    source.connect(processor);
    processor.connect(audioContext.destination);
    this.audioContext = audioContext;
    this.audioProcessor = processor;
    this.audioSource = source;
  }

  private teardownAudioProcessing() {
    if (this.audioProcessor) {
      try {
        this.audioProcessor.disconnect();
      } catch {
        /* noop */
      }
      this.audioProcessor.onaudioprocess = null;
      this.audioProcessor = null;
    }
    if (this.audioSource) {
      try {
        this.audioSource.disconnect();
      } catch {
        /* noop */
      }
      this.audioSource = null;
    }
    if (this.audioContext) {
      try {
        void this.audioContext.close();
      } catch {
        /* noop */
      }
      this.audioContext = null;
    }
  }

  private downsampleBuffer(
    buffer: Float32Array,
    inputSampleRate: number,
    outputSampleRate: number,
  ): Float32Array {
    if (outputSampleRate === inputSampleRate) {
      return buffer;
    }
    const sampleRateRatio = inputSampleRate / outputSampleRate;
    const newLength = Math.floor(buffer.length / sampleRateRatio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
      let accum = 0;
      let count = 0;
      for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
        accum += buffer[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  }

  private floatTo16BitPCM(buffer: Float32Array): ArrayBuffer {
    const output = new ArrayBuffer(buffer.length * 2);
    const view = new DataView(output);
    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return output;
  }

  private startKeepAlive() {
    this.stopKeepAlive();
    if (typeof window === "undefined") {
      return;
    }
    this.keepAliveTimer = window.setInterval(() => {
      this.sendSocketMessage({ type: "KeepAlive" });
    }, 5_000);
  }

  private stopKeepAlive() {
    if (this.keepAliveTimer !== null && typeof window !== "undefined") {
      window.clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  }

  private describeCloseEvent(event: CloseEvent): Error | null {
    if (event.code === 4403 || event.reason === "deepgram_forbidden") {
      return new Error(
        "Deepgram denied access to the requested streaming model. Contact Deepgram to enable the nova tier for this key.",
      );
    }
    if (event.code === 4401 || event.reason === "unauthorized") {
      return new Error(
        "Relay authorization failed. Refresh the page to obtain a new token.",
      );
    }
    if (event.code === 1011 && event.reason === "deepgram_error") {
      return new Error("Deepgram relay connection failed unexpectedly.");
    }
    return null;
  }
}
