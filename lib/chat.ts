// lib/chat.ts
export type Message = {
  id: string;
  text: string;
  author?: string;
};

export const sampleTranscripts: Message[] = [
  { id: "1", text: "Welcome to BetweenUs!", author: "System" },
  { id: "2", text: "Click start to begin speaking", author: "System" }
];
