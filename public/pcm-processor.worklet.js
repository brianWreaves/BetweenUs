// public/pcm-processor.worklet.js
// AudioWorklet processor for PCM encoding and downsampling

class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.targetSampleRate = 16000;
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferIndex = 0;
    this.downsampleRatio = sampleRate / this.targetSampleRate;
    this.lastOutputSample = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }

    const inputChannel = input[0];

    for (let i = 0; i < inputChannel.length; i++) {
      this.buffer[this.bufferIndex++] = inputChannel[i];

      if (this.bufferIndex >= this.bufferSize) {
        this.flushBuffer();
      }
    }

    return true;
  }

  flushBuffer() {
    if (this.bufferIndex === 0) return;

    // Downsample
    const downsampled = this.downsample(
      this.buffer.subarray(0, this.bufferIndex),
      this.downsampleRatio
    );

    // Convert to 16-bit PCM
    const pcmBuffer = this.floatTo16BitPCM(downsampled);

    // Send to main thread
    this.port.postMessage(pcmBuffer, [pcmBuffer.buffer]);

    this.bufferIndex = 0;
  }

  downsample(buffer, ratio) {
    if (ratio === 1) return buffer;

    const newLength = Math.floor(buffer.length / ratio);
    const result = new Float32Array(newLength);
    let offsetResult = 0;
    let offsetBuffer = 0;

    while (offsetResult < result.length) {
      const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;

      for (
        let i = offsetBuffer;
        i < nextOffsetBuffer && i < buffer.length;
        i++
      ) {
        accum += buffer[i];
        count++;
      }

      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetBuffer = nextOffsetBuffer;
    }

    return result;
  }

  floatTo16BitPCM(buffer) {
    const output = new ArrayBuffer(buffer.length * 2);
    const view = new DataView(output);

    for (let i = 0; i < buffer.length; i++) {
      const s = Math.max(-1, Math.min(1, buffer[i]));
      const val = s < 0 ? s * 0x8000 : s * 0x7fff;
      view.setInt16(i * 2, val, true);
    }

    return output;
  }
}

registerProcessor("pcm-processor", PCMProcessor);
