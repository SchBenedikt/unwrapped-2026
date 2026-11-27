import { buildPersona, displayName } from "./archetype";
import { formatCompact, formatNumber, plural, shortDate } from "./format";
import { buildRhythm } from "./stats";
import type { WrappedData } from "./types";

export type ExportFormat = "png" | "jpeg" | "webp";

export type ExportFormatMeta = {
  id: ExportFormat;
  label: string;
  extension: string;
  mime: string;
};

export const EXPORT_FORMATS: ExportFormatMeta[] = [
  { id: "png", label: "PNG", extension: "png", mime: "image/png" },
  { id: "jpeg", label: "JPG", extension: "jpg", mime: "image/jpeg" },
  { id: "webp", label: "WebP", extension: "webp", mime: "image/webp" },
];

const WIDTH = 1080;
const HEIGHT = 1350;
const PAD = 76;

type TrackingCtx = CanvasRenderingContext2D & { letterSpacing?: string };

type Palette = {
  ink: string;
  inkRaise: string;
  cream: string;
  dim: string;
  faint: string;
  line: string;
  accent: string;
  accent2: string;
  accent3: string;
  sans: string;
  serif: string;
  mono: string;
};

const FALLBACK_PALETTE: Palette = {
  ink: "#08080b",
  inkRaise: "#0d0d13",
  cream: "#f4f0e6",
  dim: "rgb(244 240 230 / 0.66)",
  faint: "rgb(244 240 230 / 0.42)",
  line: "rgb(244 240 230 / 0.14)",
  accent: "#c8f751",
  accent2: "#a78bfa",
  accent3: "#ff6f4d",
  sans: '"Bricolage Grotesque", "Inter", system-ui, sans-serif',
  serif: '"Instrument Serif", Georgia, serif',
  mono: '"JetBrains Mono", ui-monospace, monospace',
};

function readPalette(): Palette {
  if (typeof window === "undefined") return FALLBACK_PALETTE;

  const style = window.getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;

  const creamRgb = read("--cream-rgb", "244 240 230");
  const ink = read("--ink", FALLBACK_PALETTE.ink);
  const inkRaise = read("--ink-raise", FALLBACK_PALETTE.inkRaise);

  return {
    ink,
    inkRaise,
    cream: read("--cream", FALLBACK_PALETTE.cream),
    dim: `rgb(${creamRgb} / 0.66)`,
    faint: `rgb(${creamRgb} / 0.44)`,
    line: `rgb(${creamRgb} / 0.14)`,
    accent: read("--lime", FALLBACK_PALETTE.accent),
    accent2: read("--violet", FALLBACK_PALETTE.accent2),
    accent3: read("--coral", FALLBACK_PALETTE.accent3),
    sans: FALLBACK_PALETTE.sans,
    serif: FALLBACK_PALETTE.serif,
    mono: FALLBACK_PALETTE.mono,
  };
}

function setFont(
  ctx: CanvasRenderingContext2D,
  weight: number | string,
  size: number,
  family: string,
) {
  ctx.font = `${weight} ${size}px ${family}`;
}

function tracking(ctx: CanvasRenderingContext2D, value: string) {
  (ctx as TrackingCtx).letterSpacing = value;
}

function fit(
  ctx: CanvasRenderingContext2D,
  value: string,
  maxWidth: number,
  size: number,
  weight: number | string,
  family: string,
): number {
  let current = size;
  while (current > 18) {
    setFont(ctx, weight, current, family);
    if (ctx.measureText(value).width <= maxWidth) return current;
    current -= 2;
  }
  return current;
}

function rounded(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  try {
    await Promise.all([
      document.fonts.load('600 48px "Bricolage Grotesque"'),
      document.fonts.load('400 36px "Instrument Serif"'),
      document.fonts.load('500 20px "JetBrains Mono"'),
    ]);
    await document.fonts.ready;
  } catch {
    // Fonts are a nicety; the card still renders with the fallbacks.
  }
}

function loadAvatar(url: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = (value: HTMLImageElement | null) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };

    image.crossOrigin = "anonymous";
    image.referrerPolicy = "no-referrer";
    image.onload = () => finish(image);
    image.onerror = () => finish(null);
    window.setTimeout(() => finish(null), 4000);
    image.src = url;
  });
}

function drawBackdrop(ctx: CanvasRenderingContext2D, palette: Palette) {
  const base = ctx.createLinearGradient(0, 0, WIDTH, HEIGHT);
  base.addColorStop(0, palette.inkRaise);
  base.addColorStop(0.55, palette.ink);
  base.addColorStop(1, palette.ink);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const glows: [number, number, string, number][] = [
    [80, 40, palette.accent, 0.22],
    [WIDTH - 40, 300, palette.accent2, 0.2],
    [WIDTH * 0.35, HEIGHT, palette.accent3, 0.12],
  ];
  for (const [cx, cy, color, alpha] of glows) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 520);
    glow.addColorStop(0, color);
    glow.addColorStop(1, "transparent");
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.restore();
  }

  ctx.save();
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1;
  for (let x = 0; x <= WIDTH; x += 90) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, HEIGHT);
    ctx.stroke();
  }
  for (let y = 0; y <= HEIGHT; y += 90) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WIDTH, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAvatar(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement | null,
  palette: Palette,
  initial: string,
) {
  const cx = PAD + 54;
  const cy = 238;
  const radius = 54;

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius + 3, 0, Math.PI * 2);
  const ring = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  ring.addColorStop(0, palette.accent);
  ring.addColorStop(0.5, palette.accent2);
  ring.addColorStop(1, palette.accent3);
  ctx.strokeStyle = ring;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.clip();
  if (image) {
    ctx.drawImage(image, cx - radius, cy - radius, radius * 2, radius * 2);
  } else {
    const fill = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
    fill.addColorStop(0, palette.accent2);
    fill.addColorStop(1, palette.accent3);
    ctx.fillStyle = fill;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.fillStyle = palette.ink;
    setFont(ctx, 700, 52, palette.sans);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(initial.toUpperCase(), cx, cy + 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
  }
  ctx.restore();
}

/** Draws the 1080×1350 share card for the active theme and returns it as a blob. */
export async function renderShareCard(
  data: WrappedData,
  format: ExportFormat = "png",
): Promise<Blob> {
  const palette = readPalette();
  const persona = buildPersona(data);
  const name = displayName(data);
  const contributions = data.contributions;
  const rhythm = contributions ? buildRhythm(contributions) : null;
  const avatar = await loadAvatar(data.user.avatarUrl);
  await ensureFonts();

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not available in this browser.");

  drawBackdrop(ctx, palette);

  // ---- header -----------------------------------------------------------
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillStyle = palette.accent;
  setFont(ctx, 700, 30, palette.sans);
  ctx.fillText("✳", PAD, 106);

  ctx.fillStyle = palette.dim;
  setFont(ctx, 500, 20, palette.mono);
  tracking(ctx, "5px");
  ctx.fillText("GITHUB UNWRAPPED", PAD + 46, 104);
  tracking(ctx, "0px");

  ctx.textAlign = "right";
  ctx.fillStyle = palette.faint;
  setFont(ctx, 500, 18, palette.mono);
  tracking(ctx, "4px");
  ctx.fillText("2026 EDITION", WIDTH - PAD, 104);
  tracking(ctx, "0px");
  ctx.textAlign = "left";

  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(PAD, 134);
  ctx.lineTo(WIDTH - PAD, 134);
  ctx.stroke();

  // ---- identity ---------------------------------------------------------
  drawAvatar(ctx, avatar, palette, name.slice(0, 1) || "?");

  ctx.fillStyle = palette.cream;
  const nameSize = fit(ctx, name, WIDTH - (PAD + 132) - PAD, 46, 600, palette.sans);
  setFont(ctx, 600, nameSize, palette.sans);
  ctx.fillText(name, PAD + 132, 236);

  ctx.fillStyle = palette.accent;
  setFont(ctx, 500, 22, palette.mono);
  ctx.fillText(`@${data.user.login}`, PAD + 132, 276);

  ctx.fillStyle = palette.accent2;
  const personaSize = fit(ctx, persona.title, WIDTH - 2 * PAD, 40, 400, palette.serif);
  setFont(ctx, 400, personaSize, palette.serif);
  ctx.fillText(persona.title, PAD, 388);

  ctx.fillStyle = palette.faint;
  setFont(ctx, 400, 22, palette.mono);
  ctx.fillText(persona.tagline, PAD, 422);

  // ---- hero number ------------------------------------------------------
  const heroValue = contributions ? contributions.total : data.activity.commits;
  const heroLabel = contributions
    ? "CONTRIBUTIONS · LAST 12 MONTHS"
    : `COMMITS · LAST ${data.activity.windowDays} DAYS`;
  const heroNote = contributions
    ? `${formatNumber(contributions.activeDays)} active ${plural(
        contributions.activeDays,
        "day",
      )} · ${rhythm ? `${Math.round(rhythm.consistency * 100)}% of the year` : "public calendar"}`
    : `${formatNumber(data.activity.pullRequests)} PRs · ${formatNumber(
        data.activity.reposTouched,
      )} repos touched`;

  ctx.fillStyle = palette.faint;
  setFont(ctx, 500, 18, palette.mono);
  tracking(ctx, "4px");
  ctx.fillText(heroLabel, PAD, 486);
  tracking(ctx, "0px");

  const heroSize = fit(ctx, formatNumber(heroValue), 620, 150, 600, palette.sans);
  setFont(ctx, 600, heroSize, palette.sans);
  ctx.fillStyle = palette.cream;
  ctx.fillText(formatNumber(heroValue), PAD, 620);

  ctx.fillStyle = palette.dim;
  setFont(ctx, 400, 24, palette.sans);
  ctx.fillText(heroNote, PAD, 662);

  // Right-hand side of the hero: streaks and the busiest day.
  const rightX = WIDTH - PAD;
  ctx.textAlign = "right";
  ctx.fillStyle = palette.faint;
  setFont(ctx, 500, 16, palette.mono);
  tracking(ctx, "3px");
  ctx.fillText("LONGEST STREAK", rightX, 500);
  ctx.fillText("BUSIEST DAY", rightX, 576);
  tracking(ctx, "0px");

  ctx.fillStyle = palette.accent;
  setFont(ctx, 600, 40, palette.sans);
  ctx.fillText(
    contributions ? `${contributions.longestStreak}d` : `${data.activity.reposTouched}`,
    rightX,
    546,
  );

  ctx.fillStyle = palette.cream;
  setFont(ctx, 600, 28, palette.sans);
  ctx.fillText(
    rhythm?.bestDay ? `${formatNumber(rhythm.bestDay.count)}` : "—",
    rightX,
    622,
  );
  ctx.fillStyle = palette.dim;
  setFont(ctx, 400, 18, palette.mono);
  ctx.fillText(rhythm?.bestDay ? shortDate(rhythm.bestDay.date) : "no calendar", rightX, 650);
  ctx.textAlign = "left";

  // ---- stat grid --------------------------------------------------------
  ctx.strokeStyle = palette.line;
  ctx.beginPath();
  ctx.moveTo(PAD, 700);
  ctx.lineTo(WIDTH - PAD, 700);
  ctx.stroke();

  const cells = [
    { label: "STARS", value: formatCompact(data.stats.totalStars) },
    { label: "PUBLIC REPOS", value: formatNumber(data.user.publicRepos) },
    { label: "FOLLOWERS", value: formatCompact(data.user.followers) },
    {
      label: "AVG / ACTIVE DAY",
      value: rhythm ? rhythm.averagePerActiveDay.toFixed(1) : formatNumber(data.activity.commits),
    },
    { label: "LANGUAGES", value: String(data.stats.languageCount) },
    {
      label: "ACTIVE DAYS",
      value: contributions ? formatNumber(contributions.activeDays) : `${data.activity.reposTouched}`,
    },
  ];

  const columnWidth = (WIDTH - 2 * PAD) / 3;
  cells.forEach((cell, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = PAD + column * columnWidth;
    const y = 758 + row * 108;

    ctx.fillStyle = palette.faint;
    setFont(ctx, 500, 16, palette.mono);
    tracking(ctx, "3px");
    ctx.fillText(cell.label, x, y);
    tracking(ctx, "0px");

    ctx.fillStyle = palette.cream;
    setFont(ctx, 600, 44, palette.sans);
    ctx.fillText(cell.value, x, y + 50);
  });

  // ---- languages --------------------------------------------------------
  const languages = data.stats.topLanguages.slice(0, 3);
  if (languages.length) {
    ctx.fillStyle = palette.faint;
    setFont(ctx, 500, 16, palette.mono);
    tracking(ctx, "4px");
    ctx.fillText("TOP LANGUAGES", PAD, 1000);
    tracking(ctx, "0px");

    languages.forEach((language, index) => {
      const y = 1046 + index * 62;
      ctx.fillStyle = palette.cream;
      setFont(ctx, 500, 24, palette.sans);
      ctx.fillText(language.name, PAD, y);

      ctx.fillStyle = palette.dim;
      setFont(ctx, 400, 19, palette.mono);
      ctx.textAlign = "right";
      ctx.fillText(
        `${language.count} ${plural(language.count, "repo")} · ${Math.round(language.share * 100)}%`,
        WIDTH - PAD,
        y,
      );
      ctx.textAlign = "left";

      rounded(ctx, PAD, y + 14, WIDTH - 2 * PAD, 8, 4);
      ctx.fillStyle = palette.line;
      ctx.fill();

      rounded(ctx, PAD, y + 14, Math.max(10, (WIDTH - 2 * PAD) * language.share), 8, 4);
      ctx.fillStyle = language.color;
      ctx.fill();
    });
  }

  // ---- footer -----------------------------------------------------------
  ctx.strokeStyle = palette.line;
  ctx.beginPath();
  ctx.moveTo(PAD, 1236);
  ctx.lineTo(WIDTH - PAD, 1236);
  ctx.stroke();

  ctx.fillStyle = palette.dim;
  setFont(ctx, 500, 20, palette.mono);
  ctx.fillText(`github.com/${data.user.login}`, PAD, 1280);

  ctx.textAlign = "right";
  ctx.fillStyle = palette.faint;
  setFont(ctx, 500, 18, palette.mono);
  tracking(ctx, "3px");
  ctx.fillText("UNWRAPPED · 2026", WIDTH - PAD, 1280);
  tracking(ctx, "0px");

  ctx.fillStyle = palette.faint;
  setFont(ctx, 400, 17, palette.mono);
  ctx.fillText("Built from public GitHub data · nothing stored", WIDTH - PAD, 1312);

  const meta = EXPORT_FORMATS.find((entry) => entry.id === format) ?? EXPORT_FORMATS[0];
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("The browser could not encode the image."));
      },
      meta.mime,
      0.94,
    );
  });
}

export function shareCardFilename(login: string, format: ExportFormat): string {
  const meta = EXPORT_FORMATS.find((entry) => entry.id === format) ?? EXPORT_FORMATS[0];
  return `github-unwrapped-2026-${login.toLowerCase()}.${meta.extension}`;
}

export function downloadShareCard(blob: Blob, login: string, format: ExportFormat) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = shareCardFilename(login, format);
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 6000);
}
