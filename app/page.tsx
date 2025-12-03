"use client";

import React, { useState } from "react";
import { getSpeechService } from "../lib/speech/factory";
import { sampleTranscripts, Message } from "../lib/chat";
import type { SpeechServiceKey } from "../lib/speech/types";

export default function Page() {
  const [messages, setMessages] = useState<Message[]>(sampleTranscripts);

  const startService = async () => {
    const serviceKey: SpeechServiceKey = "microphone"; // or "deepgram"
    const service = getSpeechService(serviceKey, { apiKey: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY });

    service.onResult((text) => {
      setMessages((prev) => [...prev, { id: crypto.randomUUID(), text, author: "User" }]);
    });

    service.onError((e) => console.error("Speech error:", e));
    service.onStop(() => console.log("Speech stopped"));

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

      <button onClick={startService} style={{ marginTop: 20 }}>
        Start Speech
      </button>
    </main>
  );
}
