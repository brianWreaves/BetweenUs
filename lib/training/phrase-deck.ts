export type PhraseCategory =
  | "Common commands"
  | "Daily conversation"
  | "Phonetic balance"
  | "Numbers and dates"
  | "Radio alphabet"
  | "Common nouns"
  | "Action verbs";

export type TrainingPhrase = {
  id: string;
  text: string;
  category: PhraseCategory;
};

const phrases: TrainingPhrase[] = [
  {
    id: "cmd-001",
    text: "Please grab my communication device.",
    category: "Common commands",
  },
  {
    id: "cmd-002",
    text: "Can you raise the back of my chair?",
    category: "Common commands",
  },
  {
    id: "daily-001",
    text: "How was your day at work today?",
    category: "Daily conversation",
  },
  {
    id: "daily-002",
    text: "Let's plan dinner with the family this weekend.",
    category: "Daily conversation",
  },
  {
    id: "phonetic-001",
    text: "The quick brown fox jumps over the lazy dog.",
    category: "Phonetic balance",
  },
  {
    id: "phonetic-002",
    text: "Bright vixens jump; dozy fowl quack.",
    category: "Phonetic balance",
  },
  {
    id: "numbers-001",
    text: "Today is the twenty-ninth of October, twenty twenty-five.",
    category: "Numbers and dates",
  },
  {
    id: "numbers-002",
    text: "My appointment is at 4:15 this Thursday.",
    category: "Numbers and dates",
  },
  {
    id: "radio-001",
    text: "Call sign is Bravo Uniform Seven Six.",
    category: "Radio alphabet",
  },
  {
    id: "radio-002",
    text: "Confirm code Alpha Charlie Tango?",
    category: "Radio alphabet",
  },
  {
    id: "nouns-001",
    text: "The physio left new exercise bands in the drawer.",
    category: "Common nouns",
  },
  {
    id: "nouns-002",
    text: "Check the charger beside the lounge window.",
    category: "Common nouns",
  },
  {
    id: "verbs-001",
    text: "Remember to rotate my wrists slowly every hour.",
    category: "Action verbs",
  },
  {
    id: "verbs-002",
    text: "Let's practice swallowing with small sips of water.",
    category: "Action verbs",
  },
];

export function getPhraseDeck(): TrainingPhrase[] {
  return phrases;
}
