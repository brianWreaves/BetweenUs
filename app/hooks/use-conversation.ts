"use client";

import { useCallback, useEffect, useState } from "react";
import type { SpeechService, SpeechResult } from "@/lib/speech/service";

export type ConversationMessage = {
  id: string;
  text: string;
  final: boolean;
};

export type ConversationStatus = "idle" | "connecting" | "listening" | "error";

export type UseConversationOptions = {
  initialMessages?: string[];
};

export function useConversation(
  service: SpeechService,
  options?: UseConversationOptions,
) {
  const [messages, setMessages] = useState<ConversationMessage[]>(() =>
    (options?.initialMessages ?? []).map((text, index) => ({
      id: `seed-${index}`,
      text,
      final: true,
    })),
  );
  const [draft, setDraft] = useState<string>("");
  const [status, setStatus] = useState<ConversationStatus>("idle");

  const handleResult = useCallback(
    (result: SpeechResult) => {
      if (!result.text) {
        return;
      }
      if (result.final) {
        setDraft("");
        setMessages((current) => [
          ...current,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: result.text,
            final: true,
          },
        ]);
      } else {
        setDraft(result.text);
      }
    },
    [setDraft, setMessages],
  );

  const handleError = useCallback(
    (error: Error) => {
      console.error("BetweenUs mock speech error", error);
      setStatus("error");
      setDraft("");
    },
    [setStatus],
  );

  const handleStop = useCallback(() => {
    setStatus("idle");
    setDraft("");
  }, []);

  const start = useCallback(async () => {
    if (status === "listening" || status === "connecting") {
      return;
    }
    setStatus("connecting");
    setDraft("");
    try {
      await service.start();
      setStatus("listening");
    } catch (error) {
      handleError(error instanceof Error ? error : new Error("Unable to start"));
    }
  }, [service, status, handleError]);

  const stop = useCallback(async () => {
    if (status === "idle") {
      return;
    }
    await service.stop();
    setStatus("idle");
    setDraft("");
  }, [service, status]);

  const clear = useCallback(() => {
    setMessages([]);
    setDraft("");
  }, []);

  useEffect(() => {
    const unsubscribeResult = service.onResult(handleResult);
    const unsubscribeError = service.onError(handleError);
    const unsubscribeStop = service.onStop(handleStop);
    return () => {
      unsubscribeResult();
      unsubscribeError();
      unsubscribeStop();
    };
  }, [service, handleResult, handleError, handleStop]);

  const handleResult = useCallback(
    (result: SpeechResult) => {
      if (!result.text) {
        return;
      }
      if (result.final) {
        setDraft("");
        setMessages((current) => [
          ...current,
          {
            id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: result.text,
            final: true,
          },
        ]);
      } else {
        setDraft(result.text);
      }
    },
    [setDraft, setMessages],
  );

  const handleError = useCallback(
    (error: Error) => {
      console.error("BetweenUs mock speech error", error);
      setStatus("error");
      setDraft("");
    },
    [setStatus],
  );

  const handleStop = useCallback(() => {
    setStatus("idle");
    setDraft("");
  }, []);

  return {
    messages,
    draft,
    status,
    isListening: status === "listening",
    start,
    stop,
    clear,
  };
}
