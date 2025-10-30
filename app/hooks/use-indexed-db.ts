"use client";

import { useEffect, useState } from "react";
import { ensureDatabaseReady } from "@/lib/storage/indexed-db";

type IndexedDbState = "checking" | "ready" | "unavailable";

export function useIndexedDb() {
  const [status, setStatus] = useState<IndexedDbState>("checking");

  useEffect(() => {
    let cancelled = false;

    ensureDatabaseReady()
      .then((isReady) => {
        if (!cancelled) {
          setStatus(isReady ? "ready" : "unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("unavailable");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
