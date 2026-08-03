import type { Metadata } from "next";
import { Caveat, Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { UIPreferencesProvider } from "@/lib/store/ui-preferences";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// Editorial display face, used for balances and page headings.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  axes: ["SOFT", "WONK", "opsz"],
});

/*
 * Handwritten face for the Flows scrapbook. Used ONLY for a Flow's name — never
 * for an amount. A figure that looks hand-drawn looks uncertain, which is the
 * opposite of what a balance should feel like. See docs/flow-budgets.md §9.
 */
const caveat = Caveat({
  variable: "--font-caveat",
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
      className={`${inter.variable} ${fraunces.variable} ${caveat.variable} h-full`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <UIPreferencesProvider>{children}</UIPreferencesProvider>
      </body>
    </html>
  );
}
