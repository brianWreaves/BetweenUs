"use client";

import { Message, sampleTranscripts } from "@/lib/chat";
import { type SpeechService } from "../lib/speech/speech-service"; // <-- CORRECTED PATH
import { getSpeechService } from "../lib/speech/factory"; // <-- CORRECTED PATH
import { SpeechServiceStatus } from "../lib/speech/types"; // <-- CORRECTED PATH
import {
  AudioIcon,
  CheckIcon,
  CornerDownLeftIcon,
  MicIcon,
  Volume2Icon,
  VolumeXIcon,
} from "lucide-react";
import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

const getModelOverride = (messages: Message[]) => {
  const lastMessage = messages[messages.length - 1];
  if (lastMessage?.role === "function") {
    try {
      const toolCallId = lastMessage.content.trim();
      const nextMessage = messages[messages.length - 2];
      const toolCall = nextMessage.tool_calls?.find(
        (tc) => tc.id === toolCallId,
      );
      if (
        toolCall &&
        toolCall.function.name === "set_model" &&
        toolCall.function.arguments
      ) {
        return JSON.parse(toolCall.function.arguments).model;
      }
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }
  return undefined;
};

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [speechServiceKey, setSpeechServiceKey] = useState<string>("deepgram");
  const [volume, setVolume] = useState<number>(1);
  const [modelOverride, setModelOverride] = useState<string | undefined>(
    undefined,
  );
  const [status, setStatus] = useState<SpeechServiceStatus>(
    SpeechServiceStatus.Stopped,
  );
  const statusRef = useRef(status);
  statusRef.current = status;

  const handleMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const speechService = useMemo(
    () =>
      getSpeechService(speechServiceKey, {
        fallbackScript: sampleTranscripts,
        modelOverride: modelOverride || undefined,
      }),
    [speechServiceKey, modelOverride],
  );

  const start = useCallback(() => {
    if (statusRef.current === SpeechServiceStatus.Started) {
      speechService.stop();
      setStatus(SpeechServiceStatus.Stopped);
      return;
    }
    speechService.start();
    setStatus(SpeechServiceStatus.Started);
  }, [speechService]);

  const onStop = useCallback(() => {
    if (statusRef.current === SpeechServiceStatus.Started) {
      setStatus(SpeechServiceStatus.Stopped);
    }
  }, []);

  const onResult = useCallback(
    (data: any) => {
      if (data.is_final) {
        handleMessage({ role: "user", content: data.speech_to_text });
      }
    },
    [handleMessage],
  );

  const onError = useCallback((error: Error) => {
    console.error(error);
  }, []);

  const handleSubmit = useCallback(
    async (
      e: React.FormEvent<HTMLFormElement> | undefined,
      message: string | undefined = input,
    ) => {
      e?.preventDefault();
      if (!message || message.trim() === "") return;

      if (speechService.start) speechService.stop();

      const newMessage: Message = { role: "user", content: message };
      setMessages((prev) => [...prev, newMessage]);
      setInput("");

      const currentModelOverride = getModelOverride([...messages, newMessage]);

      setModelOverride(currentModelOverride);
    },
    [input, messages, speechService],
  );

  useEffect(() => {
    if (speechService.onResult) speechService.onResult(onResult);
    if (speechService.onError) speechService.onError(onError);
    if (speechService.onStop) speechService.onStop(onStop);
  }, [onError, onResult, onStop, speechService]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(undefined);
      }
    },
    [handleSubmit],
  );

  return (
    <main className="flex flex-col h-full items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-6">BetweenUs</h1>
      <div className="flex-grow w-full max-w-2xl overflow-y-auto space-y-4 mb-4 p-4 border rounded-lg bg-white shadow-inner">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 italic">
            Start a conversation by typing a message or pressing the mic button.
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                message.role === "user"
                  ? "bg-blue-100 self-end ml-auto"
                  : "bg-gray-100 self-start mr-auto"
              }`}
            >
              <span className="font-semibold capitalize">
                {message.role}:
              </span>{" "}
              {message.content}
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-2xl flex space-x-2">
        <div className="relative flex-grow">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="w-full p-3 border rounded-lg focus:ring-blue-500 focus:border-blue-500 pr-12"
            disabled={status === SpeechServiceStatus.Started}
          />
          <CornerDownLeftIcon className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        </div>

        <button
          type="button"
          onClick={start}
          className={`p-3 rounded-lg text-white transition-colors duration-200 ${
            status === SpeechServiceStatus.Started
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
          title={status === SpeechServiceStatus.Started ? "Stop Recording" : "Start Recording"}
        >
          {status === SpeechServiceStatus.Started ? (
            <CheckIcon className="h-6 w-6" />
          ) : (
            <MicIcon className="h-6 w-6" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setVolume(volume === 1 ? 0 : 1)}
          className="p-3 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors duration-200"
          title={volume === 1 ? "Mute" : "Unmute"}
        >
          {volume === 1 ? (
            <Volume2Icon className="h-6 w-6 text-gray-700" />
          ) : (
            <VolumeXIcon className="h-6 w-6 text-gray-700" />
          )}
        </button>

        <select
          value={speechServiceKey}
          onChange={(e) => setSpeechServiceKey(e.target.value)}
          className="p-3 border rounded-lg bg-white shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          title="Select Speech Service"
        >
          <option value="deepgram">Deepgram</option>
          <option value="microphone">Microphone</option>
        </select>
      </form>

      <div className="mt-4 text-sm text-gray-600 flex items-center space-x-2">
        <AudioIcon className="h-4 w-4" />
        <span>
          Status:{" "}
          <span
            className={`font-semibold ${
              status === SpeechServiceStatus.Started
                ? "text-green-600"
                : "text-red-600"
            }`}
          >
            {status}
          </span>
        </span>
      </div>
    </main>
  );
}
