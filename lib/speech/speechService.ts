export interface SpeechService {
  /**
   * Starts the speech recognition service.
   */
  start: () => void;

  /**
   * Stops the speech recognition service.
   */
  stop: () => void;

  /**
   * Sets the callback function to handle speech recognition results.
   * @param callback The function to call when a result is received.
   */
  onResult?: (callback: (data: any) => void) => void;

  /**
   * Sets the callback function to handle errors.
   * @param callback The function to call when an error occurs.
   */
  onError?: (callback: (error: Error) => void) => void;

  /**
   * Sets the callback function when the service is fully stopped.
   * @param callback The function to call when the service stops.
   */
  onStop?: (callback: () => void) => void;
}
