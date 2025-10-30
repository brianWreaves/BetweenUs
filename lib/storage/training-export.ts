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
        .flatMap((phrase) => phrase.keywords ?? [])
        .map((keyword) => keyword.trim())
        .filter(Boolean),
    ),
  );

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
