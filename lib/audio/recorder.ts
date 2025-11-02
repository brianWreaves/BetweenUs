export type RecorderStatus = "idle" | "recording" | "stopped";

export type RecorderEvents = {
  onStart?: () => void;
  onStop?: (blob: Blob, durationMs: number) => void;
  onError?: (error: Error) => void;
};

export class SpeechRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private startTime: number | null = null;
  private chunks: BlobPart[] = [];
  private status: RecorderStatus = "idle";

  constructor(private readonly events: RecorderEvents = {}) {}

  getState(): RecorderStatus {
    return this.status;
  }

  async start(): Promise<void> {
    if (typeof window === "undefined") {
      throw new Error("Recorder unavailable in this environment");
    }
    if (this.status === "recording") return;

    try {
      const stream = await window.navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      this.mediaRecorder = recorder;
      this.chunks = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
        }
      };
      recorder.onerror = (event) => {
        this.status = "idle";
        this.events.onError?.(new Error(event.error?.message ?? "Recorder error"));
      };
      recorder.onstop = () => {
        const duration = this.startTime ? Date.now() - this.startTime : 0;
        const blob = new Blob(this.chunks, { type: "audio/webm" });
        this.status = "stopped";
        this.startTime = null;
        this.events.onStop?.(blob, duration);
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      this.status = "recording";
      this.startTime = Date.now();
      this.events.onStart?.();
    } catch (error) {
      this.status = "idle";
      const err =
        error instanceof Error ? error : new Error("Unable to access microphone");
      this.events.onError?.(err);
      throw err;
    }
  }

  stop(): void {
    if (this.mediaRecorder && this.status === "recording") {
      this.mediaRecorder.stop();
    }
  }

  reset(): void {
    this.mediaRecorder = null;
    this.startTime = null;
    this.chunks = [];
    this.status = "idle";
  }
}

export async function isRecorderSupported(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }
  const hasMedia = !!window.navigator.mediaDevices?.getUserMedia;
  if (!hasMedia) return false;

  try {
    const stream = await window.navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.warn("BetweenUs recorder support check failed", error);
    return false;
  }
}
