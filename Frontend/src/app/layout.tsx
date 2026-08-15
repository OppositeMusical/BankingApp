import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Caveat } from "next/font/google";
import "./globals.css";
// Side effect only: registers the cookie-backed auth token source so server
// components can make authenticated connector calls in live mode.
import "@/lib/api/server";
import { apiMode } from "@/lib/api/config";
import { ApiModeSync } from "@/lib/api/mode-sync";
import { UIPreferencesProvider } from "@/lib/store/ui-preferences";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Talents — banking that keeps your money in plain sight",
    template: "%s · Talents",
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
    var stored = localStorage.getItem('talents.theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);
    if (localStorage.getItem('talents.privacy') === 'true') {
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
      className={`${inter.variable} ${jetbrainsMono.variable} ${caveat.variable} h-full`}
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
