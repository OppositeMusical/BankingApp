import type { Metadata } from "next";
import { Press_Start_2P, Silkscreen, VT323, Teko } from "next/font/google";
import "./globals.css";
// Side effect only: registers the cookie-backed auth token source so server
// components can make authenticated connector calls in live mode.
import "@/lib/api/server";
import { apiMode } from "@/lib/api/config";
import { ApiModeSync } from "@/lib/api/mode-sync";
import { UIPreferencesProvider } from "@/lib/store/ui-preferences";

// Terminal font for body text
const vt323 = VT323({
  weight: "400",
  variable: "--font-vt323",
  subsets: ["latin"],
  display: "swap",
});

// Authentic 8-bit pixel display font for balances, headings & arcade scoreboards
const silkscreen = Silkscreen({
  weight: ["400", "700"],
  variable: "--font-silkscreen",
  subsets: ["latin"],
  display: "swap",
});

// Impactful retro-tech font for numbers
const teko = Teko({
  variable: "--font-teko",
  subsets: ["latin"],
  display: "swap",
});

// Iconic arcade cabinet pixel font for badges, flows, and arcade accents
const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-press-start",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Aster — banking that keeps your money in plain sight",
    template: "%s · Aster",
  },
  description:
    "A bank account with real privacy controls, honest fees, and planning built for careers that don't run in a straight line.",
};

/*
 * Applies the saved theme before first paint so there is no flash of the wrong
 * theme. Falls back to the OS preference. Kept inline and dependency-free
 * because it must run before React hydrates.
 */
const themeScript = `
(function () {
  try {
    var stored = localStorage.getItem('aster.theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    if (localStorage.getItem('aster.privacy') === 'true') {
      document.documentElement.setAttribute('data-privacy', 'on');
    }
  } catch (e) {
    document.documentElement.setAttribute('data-theme', 'light');
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${vt323.variable} ${silkscreen.variable} ${teko.variable} ${pressStart2P.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        {/* Resolved on the server, where API_MODE is readable. */}
        <ApiModeSync mode={apiMode()} />
        <UIPreferencesProvider>{children}</UIPreferencesProvider>
      </body>
    </html>
  );
}
