"use server";

import { NextResponse } from "next/server";

const DEEPGRAM_LISTEN_ENDPOINT = "https://api.deepgram.com/v1/listen";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Deepgram server credentials are not configured." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(DEEPGRAM_LISTEN_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nova-3",
        language: process.env.DEEPGRAM_LANGUAGE ?? "en-AU",
        interim_results: true,
        smart_format: true,
        tier: "enhanced",
        punctuate: true,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Deepgram listen request failed", text);
      return NextResponse.json(
        { error: "Unable to obtain Deepgram listen URL." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as { result?: { url?: string } };
    const url = data.result?.url;

    if (!url) {
      return NextResponse.json(
        { error: "Deepgram did not return a listen URL." },
        { status: 502 },
      );
    }

    return NextResponse.json({ url });
  } catch (error) {
    console.error("Deepgram token fetch error", error);
    return NextResponse.json(
      { error: "Unexpected error contacting Deepgram." },
      { status: 500 },
    );
  }
}
