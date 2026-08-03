"use client";

import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useUIPreferences } from "@/lib/store/ui-preferences";
import { cn } from "@/lib/utils/cn";

const buttonBase =
  "inline-flex h-11 w-11 items-center justify-center rounded-field " +
  "transition-colors duration-150 ease-[var(--ease-out)]";

/**
 * Privacy Mode is deliberately a top-level control rather than something buried
 * in settings — it is only useful if it can be hit in the second before someone
 * looks over your shoulder.
 */
export function PrivacyToggle() {
  const { privacyMode, togglePrivacyMode } = useUIPreferences();

  return (
    <button
      type="button"
      onClick={togglePrivacyMode}
      aria-pressed={privacyMode}
      className={cn(
        buttonBase,
        privacyMode
          ? "bg-accent-soft text-accent"
          : "text-ink-muted hover:bg-surface-sunk hover:text-ink",
      )}
      title={privacyMode ? "Show balances" : "Hide balances"}
    >
      {privacyMode ? (
        <EyeOff className="size-5" aria-hidden />
      ) : (
        <Eye className="size-5" aria-hidden />
      )}
      <span className="sr-only">
        {privacyMode
          ? "Privacy mode on. Show balances."
          : "Privacy mode off. Hide balances."}
      </span>
    </button>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme } = useUIPreferences();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        buttonBase,
        "text-ink-muted hover:bg-surface-sunk hover:text-ink",
      )}
      title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? (
        <Sun className="size-5" aria-hidden />
      ) : (
        <Moon className="size-5" aria-hidden />
      )}
      <span className="sr-only">
        {theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      </span>
    </button>
  );
}
