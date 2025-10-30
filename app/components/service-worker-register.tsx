"use client";

import { useEffect, useState } from "react";

const SW_PATH = "/sw.js";

type ServiceWorkerStatus = "pending" | "ready" | "unsupported";

const initialStatus: ServiceWorkerStatus = (() => {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return "unsupported";
  }
  return "pending";
})();

export function ServiceWorkerRegister() {
  const [status, setStatus] = useState<ServiceWorkerStatus>(initialStatus);

  useEffect(() => {
    if (status !== "pending") {
      return;
    }

    navigator.serviceWorker
      .register(SW_PATH)
      .then(() => setStatus("ready"))
      .catch((error) => {
        console.error("BetweenUs service worker registration failed", error);
        setStatus("unsupported");
      });
  }, [status]);

  if (status !== "pending") {
    return (
      <span className="sr-only">
        Service worker status: {status === "ready" ? "ready" : "unsupported"}
      </span>
    );
  }

  return <span className="sr-only">Service worker registering…</span>;
}
