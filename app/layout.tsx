import type { Metadata, Viewport } from "next";
import "./globals.css";

const title = "GitHub Unwrapped 2026 — your year in code";
const description =
  "Drop your GitHub handle and get a year of commits, stars, streaks and side quests turned into a scrollable story — seven themes, weekday habits, month-by-month pace and a share card you can download. No login, nothing stored.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://github-unwrapped-2026-nddgp3.freebuff.site",
  ),
  title,
  description,
  applicationName: "GitHub Unwrapped",
  openGraph: {
    title,
    description,
    type: "website",
  },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#08080b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var t=localStorage.getItem('unwrapped.theme');if(t&&t!=='midnight'){document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t==='paper'?'light':'dark';}}catch(e){}})();",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..800&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
