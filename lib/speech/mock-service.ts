import {
  SpeechErrorListener,
  SpeechResult,
  SpeechResultListener,
  SpeechService,
  SpeechStopListener,
} from "./service";

type Timer = ReturnType<typeof setTimeout>;

export type MockSpeechScript = Array<string>;

export type MockSpeechOptions = {
  partialDelayMs?: number;
  betweenPhraseDelayMs?: number;
};

export function createMockSpeechService(
  script: MockSpeechScript,
  options?: MockSpeechOptions,
): SpeechService {
  return new MockSpeechService(script, options);
}

class MockSpeechService implements SpeechService {
  private readonly script: MockSpeechScript;
  private readonly partialDelay: number;
  private readonly betweenPhraseDelay: number;

  private running = false;
  private seeded = false;
  private activeTimers = new Set<Timer>();
  private phraseIndex = 0;
  private partialProgress = new Map<number, number>();

  private resultListeners = new Set<SpeechResultListener>();
  private errorListeners = new Set<SpeechErrorListener>();
  private stopListeners = new Set<SpeechStopListener>();

  constructor(script: MockSpeechScript, options?: MockSpeechOptions) {
    this.script = script;
    this.partialDelay = options?.partialDelayMs ?? 250;
    this.betweenPhraseDelay = options?.betweenPhraseDelayMs ?? 800;
  }

  async start(): Promise<void> {
    if (this.running) {
      return;
    }
    this.running = true;
    if (!this.seeded) {
      this.phraseIndex = 0;
      this.seeded = true;
    } else if (this.phraseIndex >= this.script.length) {
      this.phraseIndex = 0;
      this.partialProgress.clear();
    }
    this.flushTimers();
    this.playNextPhrase();
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }
    this.running = false;
    this.flushTimers();
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

  private schedule(callback: () => void, delay: number) {
    const timer = setTimeout(() => {
      this.activeTimers.delete(timer);
      callback();
    }, delay);
    this.activeTimers.add(timer);
  }

  private flushTimers() {
    for (const timer of this.activeTimers) {
      clearTimeout(timer);
    }
    this.activeTimers.clear();
  }

  private playNextPhrase() {
    if (!this.running) {
      return;
    }
    const phrase = this.script[this.phraseIndex];
    if (!phrase) {
      void this.stop();
      return;
    }

    const tokens = phrase.split(/\s+/).filter(Boolean);
    let partialIndex = this.partialProgress.get(this.phraseIndex) ?? 0;

    const emitPartial = () => {
      if (!this.running) {
        return;
      }

      if (partialIndex < tokens.length) {
        partialIndex += 1;
        this.partialProgress.set(this.phraseIndex, partialIndex);
        this.emitResult({
          text: tokens.slice(0, partialIndex).join(" "),
          final: false,
        });
        this.schedule(emitPartial, this.partialDelay);
        return;
      }

      this.partialProgress.delete(this.phraseIndex);
      this.emitResult({ text: phrase, final: true });
      this.phraseIndex += 1;
      this.schedule(() => this.playNextPhrase(), this.betweenPhraseDelay);
    };

    emitPartial();
  }

  private emitResult(result: SpeechResult) {
    for (const listener of this.resultListeners) {
      try {
        listener(result);
      } catch (error) {
        this.emitError(error);
      }
    }
  }

  private emitError(error: unknown) {
    const err =
      error instanceof Error ? error : new Error("Unknown speech error");
    for (const listener of this.errorListeners) {
      listener(err);
    }
  }

  private emitStop() {
    for (const listener of this.stopListeners) {
      listener();
    }
  }
}
