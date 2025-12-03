"use client";

import React, { useState } from "react";
import { getSpeechService } from "../lib/speech/factory";
import { sampleTranscripts, Message } from "../lib/chat";
import type { SpeechServiceKey } from "../lib/speech/types";

export default function Page() {
  const [messages, setMessages] = useState<Message[]>(sampleTranscripts);

  const handleStart = async () => {
    const serviceKey: SpeechServiceKey = "microphone"; // or “deepgram”
    const service = getSpeechService(serviceKey, { apiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY });

    service.onResult((text: string) => {
      const newMsg: Message = { id: crypto.randomUUID(), text, author: "User" };
      setMessages((prev) => [...prev, newMsg]);
    });

    service.onError((err: Error) => {
      console.error("Speech error:", err);
    });

    service.onStop(() => {
      console.log("Speech stopped");
    });

    await service.start();
  };

  return (
    <main style={{ padding: 24 }}>
      <h1>BetweenUs</h1>

      {messages.map((m) => (
        <p key={m.id}>
          <strong>{m.author ?? "User"}:</strong> {m.text}
        </p>
      ))}

      <button onClick={handleStart} style={{ marginTop: 20 }}>
        Start Speech
      </button>
    </main>
  );
}
