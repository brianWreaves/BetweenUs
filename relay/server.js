const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const http = require("http");
const WebSocket = require("ws");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
const DEEPGRAM_LANGUAGE = process.env.DEEPGRAM_LANGUAGE || "en-AU";
const RELAY_SHARED_SECRET = process.env.RELAY_SHARED_SECRET;
const TOKEN_TTL_MS = Number(process.env.RELAY_TOKEN_TTL_MS ?? 30_000);

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

wss.on("connection", (client, request) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  const ts = url.searchParams.get("ts");
  const nonce = url.searchParams.get("nonce");
  const sig = url.searchParams.get("sig");

  if (!validateSignature(ts, nonce, sig)) {
    client.close(4401, "unauthorized");
    return;
  }

  const deepgramUrl = new URL("wss://api.deepgram.com/v1/listen");
  deepgramUrl.searchParams.set("model", "nova-3");
  deepgramUrl.searchParams.set("language", DEEPGRAM_LANGUAGE);
  deepgramUrl.searchParams.set("interim_results", "true");
  deepgramUrl.searchParams.set("smart_format", "true");
  deepgramUrl.searchParams.set("tier", "enhanced");
  deepgramUrl.searchParams.set("punctuate", "true");

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
    dgSocket.send(payload);
  });

  client.on("close", () => {
    if (dgSocket.readyState === WebSocket.OPEN) {
      dgSocket.close();
    }
  });

  client.on("error", (error) => {
    console.error("Client socket error", error);
    closeBoth(1011, "client_error");
  });

  dgSocket.on("open", () => {
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
    console.error("Deepgram socket error", error);
    closeBoth(1011, "deepgram_error");
  });

  dgSocket.on("unexpected-response", (_req, response) => {
    const status = response?.statusCode;
    console.error("Deepgram unexpected response", status);
    if (status === 403) {
      closeBoth(4403, "deepgram_forbidden");
    } else {
      closeBoth(1011, status ? `deepgram_${status}` : "deepgram_unexpected");
    }
  });

  dgSocket.on("close", () => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ type: "ended" }));
      client.close(1000, "deepgram_closed");
    }
  });
});

server.listen(PORT, () => {
  console.log(`BetweenUs relay listening on port ${PORT}`);
});
