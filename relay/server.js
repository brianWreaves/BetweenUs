const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_LANGUAGE = process.env.DEEPGRAM_LANGUAGE || "en-AU";
const DEEPGRAM_MODEL = process.env.RELAY_MODEL || "nova-3";
const DEEPGRAM_TIER = process.env.RELAY_TIER;
const RELAY_SHARED_SECRET = process.env.RELAY_SHARED_SECRET;
const DEEPGRAM_ENCODING = process.env.RELAY_ENCODING;
const DEEPGRAM_SAMPLE_RATE = process.env.RELAY_SAMPLE_RATE;
const TOKEN_TTL_MS = Number(process.env.RELAY_TOKEN_TTL_MS ?? 30_000);
const AUDIO_DUMP_DIR = process.env.RELAY_AUDIO_DUMP_DIR;

if (!DEEPGRAM_API_KEY) {
  throw new Error("DEEPGRAM_API_KEY is not set");
}
if (!RELAY_SHARED_SECRET) {
  throw new Error("RELAY_SHARED_SECRET is not set");
}

const app = express();
app.use(cors());
app.use(morgan("tiny"));

app.get("/healthz", (_req, res) => {
  res.json({ ok: true, service: "betweenus-relay" });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/stream" });

function validateSignature(ts, nonce, sig) {
  if (!ts || !nonce || !sig) return false;
  const delta = Math.abs(Date.now() - Number(ts));
  if (Number.isNaN(delta) || delta > TOKEN_TTL_MS) {
    return false;
  }
  const payload = `${ts}.${nonce}`;
  const expected = crypto
    .createHmac("sha256", RELAY_SHARED_SECRET)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
  } catch {
    return false;
  }
}

function dumpAudioChunk(connectionId, chunk) {
  if (!AUDIO_DUMP_DIR) {
    return;
  }
  try {
    fs.mkdirSync(AUDIO_DUMP_DIR, { recursive: true });
    const filePath = path.join(AUDIO_DUMP_DIR, `${connectionId}.webm`);
    fs.writeFileSync(filePath, chunk);
    console.log(`[relay:${connectionId}] wrote debug audio chunk to ${filePath}`);
  } catch (error) {
    console.error(`[relay:${connectionId}] failed to write debug audio`, error);
  }
}

wss.on("connection", (client, request) => {
  const connectionId =
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : crypto.randomBytes(16).toString("hex");
  const url = new URL(request.url, `http://${request.headers.host}`);
  const ts = url.searchParams.get("ts");
  const nonce = url.searchParams.get("nonce");
  const sig = url.searchParams.get("sig");

  if (!validateSignature(ts, nonce, sig)) {
    console.warn(`[relay:${connectionId}] invalid signature, closing`);
    client.close(4401, "unauthorized");
    return;
  }

  console.log(
    `[relay:${connectionId}] client connected (model=${DEEPGRAM_MODEL}, tier=${DEEPGRAM_TIER ?? "none"})`,
  );
  let bytesForwarded = 0;
  let wroteDebugChunk = false;

  const deepgramUrl = new URL("wss://api.deepgram.com/v1/listen");
  deepgramUrl.searchParams.set("model", DEEPGRAM_MODEL);
  deepgramUrl.searchParams.set("language", DEEPGRAM_LANGUAGE);
  deepgramUrl.searchParams.set("interim_results", "true");
  deepgramUrl.searchParams.set("smart_format", "true");
  deepgramUrl.searchParams.set("punctuate", "true");
  if (DEEPGRAM_TIER) {
    deepgramUrl.searchParams.set("tier", DEEPGRAM_TIER);
  }
  if (DEEPGRAM_ENCODING) {
    deepgramUrl.searchParams.set("encoding", DEEPGRAM_ENCODING);
  }
  if (DEEPGRAM_SAMPLE_RATE) {
    deepgramUrl.searchParams.set("sample_rate", DEEPGRAM_SAMPLE_RATE);
  }

  const dgSocket = new WebSocket(deepgramUrl.toString(), {
    headers: {
      Authorization: `Token ${DEEPGRAM_API_KEY}`,
    },
  });

  const closeBoth = (code, reason) => {
    try {
      client.close(code, reason);
    } catch (error) {
      console.error("Failed to close client", error);
    }
    try {
      dgSocket.close();
    } catch (error) {
      console.error("Failed to close deepgram socket", error);
    }
  };

  client.on("message", (payload) => {
    if (dgSocket.readyState !== WebSocket.OPEN) {
      return;
    }
    bytesForwarded += payload.length ?? 0;
    if (bytesForwarded === payload.length) {
      console.log(
        `[relay:${connectionId}] received first audio chunk (${payload.length} bytes)`,
      );
    }
    if (AUDIO_DUMP_DIR && !wroteDebugChunk && Buffer.isBuffer(payload)) {
      dumpAudioChunk(connectionId, payload);
      wroteDebugChunk = true;
    }
    dgSocket.send(payload);
  });

  client.on("close", (code, reason) => {
    console.log(
      `[relay:${connectionId}] client closed code=${code} reason=${reason?.toString()} totalBytes=${bytesForwarded}`,
    );
    if (dgSocket.readyState === WebSocket.OPEN) {
      dgSocket.close();
    }
  });

  client.on("error", (error) => {
    console.error("Client socket error", error);
    closeBoth(1011, "client_error");
  });

  dgSocket.on("open", () => {
    console.log(`[relay:${connectionId}] Deepgram socket open`);
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "ready" }));
    }
  });

  dgSocket.on("message", (payload) => {
    if (client.readyState !== WebSocket.OPEN) {
      return;
    }
    client.send(payload.toString());
  });

  dgSocket.on("error", (error) => {
    console.error(`[relay:${connectionId}] Deepgram socket error`, error);
    closeBoth(1011, "deepgram_error");
  });

  dgSocket.on("unexpected-response", (_req, response) => {
    const status = response?.statusCode;
    console.error(`[relay:${connectionId}] Deepgram unexpected response`, status);
    if (status === 403) {
      closeBoth(4403, "deepgram_forbidden");
    } else {
      closeBoth(1011, status ? `deepgram_${status}` : "deepgram_unexpected");
    }
  });

  dgSocket.on("close", (code, reason) => {
    console.log(
      `[relay:${connectionId}] Deepgram closed code=${code} reason=${reason?.toString()} bytesForwarded=${bytesForwarded}`,
    );
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "ended" }));
      client.close(1000, "deepgram_closed");
    }
  });
});

server.listen(PORT, () => {
  console.log(`BetweenUs relay listening on port ${PORT}`);
});
