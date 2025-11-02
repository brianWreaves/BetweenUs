import JSZip from "jszip";
import { listTrainingPhrases, getTrainingProgress } from "./indexed-db";

type TrainingExportManifest = {
  userId: string;
  phraseCount: number;
  keywords: string[];
  completionDate: string;
};

export type TrainingExportPackage = {
  manifest: TrainingExportManifest;
  transcripts: Array<{ id: string; text: string; category: string }>;
  audio: Array<{ id: string; blob?: Blob }>;
};

function formatDateYYMMDD(date: Date): string {
  const year = date.getFullYear() % 100;
  const month = date.getMonth() + 1;
  const day = date.getDate();

  return `${year.toString().padStart(2, "0")}${month
    .toString()
    .padStart(2, "0")}${day.toString().padStart(2, "0")}`;
}

export async function prepareTrainingExportPackage(
  userId: string,
  completionDate = new Date(),
): Promise<TrainingExportPackage> {
  const phrases = await listTrainingPhrases();
  const progress = await getTrainingProgress();

  const transcripts = phrases.map((phrase) => ({
    id: phrase.id,
    text: phrase.text,
    category: phrase.category,
  }));

  const audio = phrases.map((phrase) => ({
    id: phrase.id,
    blob: phrase.audio,
  }));

  const keywords = Array.from(
    new Set(
      phrases
        .flatMap((phrase) => {
          if (phrase.keywords && phrase.keywords.length > 0) {
            return phrase.keywords.map((keyword) => keyword.toLowerCase());
          }
          const matches = phrase.text.toLowerCase().match(/[a-z']+/g) ?? [];
          return matches;
        })
        .map((keyword) => keyword.trim())
        .filter((keyword) => keyword.length > 3),
    ),
  ).sort();

  const manifest: TrainingExportManifest = {
    userId,
    phraseCount: phrases.length,
    keywords,
    completionDate: formatDateYYMMDD(completionDate),
  };

  if (progress) {
    manifest.phraseCount = progress.totalRecorded;
  }

  return {
    manifest,
    transcripts,
    audio,
  };
}

async function convertWebmToWav(blob: Blob): Promise<Blob> {
  if (typeof window === "undefined" || typeof window.AudioContext === "undefined") {
    return blob;
  }

  try {
    const audioContext = new AudioContext();
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await audioContext.decodeAudioData(arrayBuffer.slice(0));

    const { numberOfChannels, sampleRate, length } = decoded;
    const wavBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(wavBuffer);

    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i += 1) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    let offset = 0;
    writeString(offset, "RIFF");
    offset += 4;
    view.setUint32(offset, 36 + length * numberOfChannels * 2, true);
    offset += 4;
    writeString(offset, "WAVE");
    offset += 4;
    writeString(offset, "fmt ");
    offset += 4;
    view.setUint32(offset, 16, true);
    offset += 4;
    view.setUint16(offset, 1, true);
    offset += 2;
    view.setUint16(offset, numberOfChannels, true);
    offset += 2;
    view.setUint32(offset, sampleRate, true);
    offset += 4;
    view.setUint32(offset, sampleRate * numberOfChannels * 2, true);
    offset += 4;
    view.setUint16(offset, numberOfChannels * 2, true);
    offset += 2;
    view.setUint16(offset, 16, true);
    offset += 2;
    writeString(offset, "data");
    offset += 4;
    view.setUint32(offset, length * numberOfChannels * 2, true);
    offset += 4;

    const interleaved = new Float32Array(length * numberOfChannels);
    for (let channel = 0; channel < numberOfChannels; channel += 1) {
      const channelData = decoded.getChannelData(channel);
      for (let i = 0; i < channelData.length; i += 1) {
        interleaved[i * numberOfChannels + channel] = channelData[i];
      }
    }

    let idx = 0;
    while (idx < interleaved.length) {
      const sample = Math.max(-1, Math.min(1, interleaved[idx]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      idx += 1;
      offset += 2;
    }

    await audioContext.close();

    return new Blob([view], { type: "audio/wav" });
  } catch (error) {
    console.warn("BetweenUs failed to convert WebM to WAV", error);
    return blob;
  }
}

export async function exportTrainingZip(userId: string) {
  const pkg = await prepareTrainingExportPackage(userId);
  const zip = new JSZip();

  zip.file("manifest.json", JSON.stringify(pkg.manifest, null, 2));
  zip.file("keywords.json", JSON.stringify(pkg.manifest.keywords, null, 2));

  pkg.transcripts.forEach((entry) => {
    zip.file(`transcripts/${entry.id}.txt`, `${entry.text}\n`);
  });

  for (const entry of pkg.audio) {
    if (!entry.blob) continue;
    const wavBlob = await convertWebmToWav(entry.blob);
    const arrayBuffer = await wavBlob.arrayBuffer();
    zip.file(`audio/${entry.id}.wav`, arrayBuffer);
  }

  const fileName = `betweenUs-training-${pkg.manifest.userId}-${pkg.manifest.completionDate}.zip`;
  const blob = await zip.generateAsync({ type: "blob" });

  return { blob, fileName };
}
