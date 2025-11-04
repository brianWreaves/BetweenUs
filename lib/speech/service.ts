export type SpeechResult = {
  text: string;
  final: boolean;
};

export type SpeechResultListener = (result: SpeechResult) => void;
export type SpeechErrorListener = (error: Error) => void;
export type SpeechStopListener = () => void;

export interface SpeechService {
  start(): Promise<void>;
  stop(): Promise<void>;
  onResult(listener: SpeechResultListener): () => void;
  onError(listener: SpeechErrorListener): () => void;
  onStop(listener: SpeechStopListener): () => void;
}
