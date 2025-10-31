"use client";

import { useEffect } from "react";

const SW_PATH = "/sw.js";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker
      .register(SW_PATH)
      .catch((error) => {
        console.error("BetweenUs service worker registration failed", error);
      });
  }, []);

  return null;
}
