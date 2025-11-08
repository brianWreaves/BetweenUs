"use server";

import crypto from "crypto";
import { NextResponse } from "next/server";

const TOKEN_TTL_MS = 30_000;

export async function GET() {
  const relayUrl = process.env.RELAY_WS_URL;
  const sharedSecret = process.env.RELAY_SHARED_SECRET;

  if (!relayUrl || !sharedSecret) {
    return NextResponse.json(
      { error: "Relay configuration missing on server." },
      { status: 500 },
    );
  }

  const issuedAt = Date.now();
  const nonce = crypto.randomUUID();
  const payload = `${issuedAt}.${nonce}`;
  const signature = crypto
    .createHmac("sha256", sharedSecret)
    .update(payload)
    .digest("hex");

  const url = new URL(relayUrl);
  url.searchParams.set("ts", issuedAt.toString());
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("sig", signature);

  return NextResponse.json({
    url: url.toString(),
    expiresAt: issuedAt + TOKEN_TTL_MS,
  });
}
