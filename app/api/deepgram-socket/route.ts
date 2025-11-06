"use server";

import { NextResponse } from "next/server";

const DEEPGRAM_PROJECT_ENDPOINT = "https://api.deepgram.com/v1/projects";

export async function GET() {
  const apiKey = process.env.DEEPGRAM_API_KEY;
  const projectId = process.env.DEEPGRAM_PROJECT_ID;
  if (!apiKey || !projectId) {
    return NextResponse.json(
      { error: "Deepgram server credentials are not configured." },
      { status: 500 },
    );
  }

  try {
    const response = await fetch(
      `${DEEPGRAM_PROJECT_ENDPOINT}/${projectId}/keys`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          comment: "BetweenUs ephemeral streaming key",
          scopes: ["listen:*:*"],
          time_to_live: 120,
        }),
      },
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("Deepgram key request failed", text);
      return NextResponse.json(
        { error: "Unable to obtain Deepgram access key." },
        { status: 502 },
      );
    }

    const data = (await response.json()) as { key?: string };
    const key = data.key;

    if (!key) {
      return NextResponse.json(
        { error: "Deepgram did not return an access key." },
        { status: 502 },
      );
    }

    const params = new URLSearchParams({
      model: "nova-3",
      language: process.env.DEEPGRAM_LANGUAGE ?? "en-AU",
      interim_results: "true",
      smart_format: "true",
      tier: "enhanced",
      punctuate: "true",
      token: key,
    });

    return NextResponse.json({
      url: `wss://api.deepgram.com/v1/listen?${params.toString()}`,
    });
  } catch (error) {
    console.error("Deepgram token fetch error", error);
    return NextResponse.json(
      { error: "Unexpected error contacting Deepgram." },
      { status: 500 },
    );
  }
}
