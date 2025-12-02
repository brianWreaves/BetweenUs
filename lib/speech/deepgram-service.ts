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
    console.log("PCM processor worklet loaded successfully");
  } catch (error) {
    console.error("Failed to load PCM processor worklet:", error);
    throw new Error("Failed to load PCM processor worklet");
  }

  const source = audioContext.createMediaStreamSource(stream);
  const workletNode = new AudioWorkletNode(audioContext, "pcm-processor");

  // Add error handling
  workletNode.onprocessorerror = (event) => {
    console.error("AudioWorklet processor error:", event);
  };

  // Handle PCM data from the worklet
  let chunkCount = 0;
  workletNode.port.onmessage = (event) => {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      return;
    }
    const pcmBuffer = event.data;
    if (pcmBuffer && pcmBuffer.byteLength > 0) {
      chunkCount++;
      if (chunkCount <= 5) {
        console.log(`Sending PCM chunk ${chunkCount}: ${pcmBuffer.byteLength} bytes`);
      }
      this.socket.send(pcmBuffer);
    }
  };

  source.connect(workletNode);
  // Don't connect to destination - we don't need audio playback
  // workletNode.connect(audioContext.destination);

  this.audioContext = audioContext;
  this.audioWorklet = workletNode;
  this.audioSource = source;
}
