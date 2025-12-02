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
  onRequestId?: (id: string) => void;
  onFatalError?: (error: Error) => void;
  onStreamError?: (error: Error) => void;
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
  private audioWorklet: AudioWorkletNode | null = null;
  private audioSource: MediaStreamAudioSourceNode | null = null;
  private keepAliveTimer: number | null = null;
  private retriedAfterUnauthorized = false;

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
    this.retriedAfterUnauthorized = false;

    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      throw new Error("Media devices unavailable in this environment.");
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      const socketUrl = await this.options.getSocketUrl();
      const socket = await this.createSocket(socketUrl);
      this.socket = socket;
      this.audioStream = stream;

      await this.startAudioWorklet(stream);

      socket.addEventListener("open", () => {
        this.startKeepAlive();
      });

      socket.addEventListener("message", (event) => {
        try {
          const payload = JSON.parse(event.data) as DeepgramTranscriptionEvent;
          if (!payload.channel) {
            const requestId = (payload as { metadata?: { request_id?: string } })
              ?.metadata?.request_id;
            if (requestId && this.options.onRequestId) {
              this.options.onRequestId(requestId);
            }
            return;
          }

          const transcript =
            payload.channel.alternatives[0]?.transcript?.trim() ?? "";
          if (!transcript) {
            return;
          }

          const isFinal = Boolean(payload.is_final);
          if (isFinal && (payload as { metadata?: { request_id?: string } })?.metadata?.request_id) {
            const requestId = (payload as { metadata?: { request_id?: string } })
              ?.metadata?.request_id;
            if (requestId && this.options.onRequestId) {
              this.options.onRequestId(requestId);
            }
          }

          this.emitResult({
            text: transcript,
            final: isFinal,
          });
        } catch (error) {
          this.emitError(
            error instanceof Error ? error : new Error("Invalid Deepgram data"),
          );
        }
      });

      socket.addEventListener("close", (event) => {
        if (event.code === 4401 && !this.retriedAfterUnauthorized) {
          this.retriedAfterUnauthorized = true;
          this.reset();
          void this.start();
          return;
        }
        const friendlyError = this.describeCloseEvent(event);
        if (friendlyError) {
          this.emitError(friendlyError);
          this.options.onStreamError?.(friendlyError);
        }
        this.emitStop();
        this.reset();
      });

      socket.addEventListener("error", () => {
        this.emitError(new Error("Deepgram socket error"));
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error("Unable to start");
      this.options.onFatalError?.(err);
      this.emitError(err);
      this.reset();
      throw err;
    }
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

  private async startAudioWorklet(stream: MediaStream) {
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

    // Load the AudioWorklet processor
    try {
      await audioContext.audioWorklet.addModule("/pcm-processor.worklet.js");
    } catch (error) {
      throw new Error("Failed to load PCM processor worklet");
    }

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

    // Handle PCM data from the worklet
    workletNode.port.onmessage = (event) => {
      if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
        return;
      }
      const pcmBuffer = event.data;
      if (pcmBuffer && pcmBuffer.byteLength > 0) {
        this.socket.send(pcmBuffer);
      }
    };

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    this.audioContext = audioContext;
    this.audioWorklet = workletNode;
    this.audioSource = source;
  }

  private teardownAudioProcessing() {
    if (this.audioWorklet) {
      try {
        this.audioWorklet.disconnect();
        this.audioWorklet.port.onmessage = null;
      } catch {
        /* noop */
      }
      this.audioWorklet = null;
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
        "Relay authorisation failed. Refresh the page to obtain a new token.",
      );
    }
    if (event.code === 1011 && event.reason === "deepgram_error") {
      return new Error("Deepgram relay connection failed unexpectedly.");
    }
    return null;
  }
}
