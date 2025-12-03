export enum SpeechServiceStatus {
  Stopped = "Stopped",
  Started = "Started",
  Initializing = "Initializing",
  Error = "Error",
}

export interface RetryPolicy {
  shouldRetry: (request: Promise<Response>) => Promise<{ request: Promise<Response>; shouldContinue: boolean; }>;
}

export interface SpeechServiceOptions {
  fallbackScript?: string;
  modelOverride?: string;
  apiKey?: string;
  retry?: RetryPolicy;
}

export interface DeepgramOptions extends SpeechServiceOptions {
  getSocketUrl: () => Promise<string | null>;
}
