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

export class DeepgramSpeechService implements SpeechService {
  private readonly options: DeepgramSpeechOptions;
  private socket: DeepgramSocket | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;

  private resultListeners = new Set<SpeechResultListener>();
  private errorListeners = new Set<SpeechErrorListener>();
  private stopListeners = new Set<SpeechStopListener>();

  constructor(options: DeepgramSpeechOptions) {
    this.options = options;
  }

  async start(): Promise<void> {
    if (this.socket || this.mediaRecorder) {
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

    if (typeof MediaRecorder === "undefined") {
      throw new Error("MediaRecorder API is not supported in this browser.");
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
      audioBitsPerSecond: 128_000,
    });
    this.mediaRecorder = recorder;

    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data) as DeepgramTranscriptionEvent;
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

    socket.addEventListener("close", () => {
      this.emitStop();
      this.reset();
    });

    socket.addEventListener("error", () => {
      this.emitError(new Error("Deepgram socket error"));
    });

    recorder.addEventListener("dataavailable", (event) => {
      if (!socket || event.data.size === 0 || socket.readyState !== WebSocket.OPEN) {
        return;
      }
      socket.send(event.data);
    });

    recorder.start(250);
  }

  async stop(): Promise<void> {
    if (this.mediaRecorder?.state === "recording") {
      this.mediaRecorder.stop();
    }
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
    if (this.mediaRecorder) {
      if (this.mediaRecorder.state !== "inactive") {
        this.mediaRecorder.stop();
      }
      this.mediaRecorder = null;
    }
    if (this.audioStream) {
      this.audioStream.getTracks().forEach((track) => track.stop());
      this.audioStream = null;
    }
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
}
