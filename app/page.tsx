"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Backdrop } from "@/components/Backdrop";
import { EasterEggs } from "@/components/EasterEggs";
import { Landing } from "@/components/Landing";
import { Loading } from "@/components/Loading";
import { Story } from "@/components/Story";
import { Toaster } from "@/components/Toaster";
import type { WrappedData } from "@/lib/types";

type Status = "idle" | "loading" | "ready";

const MIN_LOADING_MS = 1900;

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [data, setData] = useState<WrappedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeHandle, setActiveHandle] = useState("");
  const requestId = useRef(0);

  const start = useCallback(async (raw: string) => {
    const handle = raw.trim().replace(/^@+/, "");
    if (!handle) return;

    const currentRequest = ++requestId.current;
    setActiveHandle(handle);
    setError(null);
    setStatus("loading");
    const startedAt = Date.now();

    try {
      const response = await fetch(`/api/wrapped?username=${encodeURIComponent(handle)}`);
      const payload = await response.json();

      if (currentRequest !== requestId.current) return;

      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Could not read that profile.");
      }

      const remaining = MIN_LOADING_MS - (Date.now() - startedAt);
      if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining));
      if (currentRequest !== requestId.current) return;

      setData(payload.data as WrappedData);
      setStatus("ready");
      window.history.replaceState({}, "", `?u=${encodeURIComponent(payload.data.user.login)}`);
    } catch (caught) {
      if (currentRequest !== requestId.current) return;
      setError(caught instanceof Error ? caught.message : "Something broke along the way.");
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("u");
    if (fromUrl) void start(fromUrl);
  }, [start]);

  const reset = useCallback(() => {
    requestId.current += 1;
    setStatus("idle");
    setData(null);
    setError(null);
    window.history.replaceState({}, "", window.location.pathname);
  }, []);

  return (
    <>
      <Backdrop />
      <EasterEggs />
      <Toaster />
      {status === "ready" && data ? <Story data={data} onRestart={reset} /> : null}
      {status === "loading" ? <Loading handle={activeHandle} /> : null}
      {status === "idle" ? <Landing onSubmit={start} error={error} /> : null}
    </>
  );
}
