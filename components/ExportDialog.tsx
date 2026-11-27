"use client";

import { useEffect, useRef, useState } from "react";
import {
  EXPORT_FORMATS,
  downloadShareCard,
  renderShareCard,
  type ExportFormat,
} from "@/lib/export";
import type { WrappedData } from "@/lib/types";

type Status = "working" | "ready" | "error";

export function ExportDialog({ data, onClose }: { data: WrappedData; onClose: () => void }) {
  const [format, setFormat] = useState<ExportFormat>("png");
  const [status, setStatus] = useState<Status>("working");
  const [preview, setPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const closeButton = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    let url: string | null = null;

    setStatus("working");
    setMessage(null);

    renderShareCard(data, format)
      .then((blob) => {
        if (!alive) return;
        url = URL.createObjectURL(blob);
        setPreview(url);
        setStatus("ready");
      })
      .catch(() => {
        if (!alive) return;
        setStatus("error");
        setMessage("This browser could not draw the card. Try the PNG format again.");
      });

    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [data, format]);

  const activeFormat = EXPORT_FORMATS.find((entry) => entry.id === format) ?? EXPORT_FORMATS[0];

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const blob = await renderShareCard(data, format);
      downloadShareCard(blob, data.user.login, format);
    } catch {
      setMessage("The download was blocked. Allow downloads for this page and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="exportOverlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="exportDialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="exportTitle"
        aria-describedby="exportNote"
      >
        <header className="exportDialog__head">
          <div>
            <p className="kicker">Share card</p>
            <h2 className="exportDialog__title" id="exportTitle">
              Your year, as a picture
            </h2>
          </div>
          <button
            ref={closeButton}
            type="button"
            className="exportDialog__close"
            onClick={onClose}
            aria-label="Close the export dialog"
          >
            ✕
          </button>
        </header>

        <div className="exportDialog__preview">
          {status === "working" ? <div className="exportSkeleton" aria-label="Rendering the card" /> : null}
          {status === "ready" && preview ? (
            // The blob URL is generated locally; nothing leaves the browser.
            // eslint-disable-next-line @next/next/no-img-element
            <img className="exportDialog__image" src={preview} alt={`Share card for ${data.user.login}`} />
          ) : null}
          {status === "error" ? (
            <p className="exportDialog__fallback">
              The image could not be rendered here. Everything else still works — try PNG.
            </p>
          ) : null}
        </div>

        <div className="exportDialog__controls">
          <div className="segmented" role="group" aria-label="Image format">
            {EXPORT_FORMATS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className="segmented__btn"
                aria-pressed={entry.id === format}
                onClick={() => setFormat(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="btn btn--primary"
            onClick={save}
            disabled={status !== "ready" || saving}
          >
            {saving ? "Rendering…" : `Download ${activeFormat.label}`}
          </button>
        </div>

        <p className="exportDialog__note" id="exportNote">
          1080 × 1350 px · follows your current theme · rendered on your device, nothing uploaded
        </p>
        {message ? (
          <p className="exportDialog__error" role="alert">
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
