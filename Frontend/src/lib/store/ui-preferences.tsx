"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

export type Theme = "light" | "dark";

type UIPreferences = {
  theme: Theme;
  toggleTheme: () => void;
  /**
   * Privacy Mode blurs every balance and amount on screen so the app can be
   * used in a cafe, an open-plan office, or next to someone whose access to
   * your finances you'd rather limit. It persists across reloads on purpose:
   * a privacy control that silently switches itself off is worse than none.
   */
  privacyMode: boolean;
  togglePrivacyMode: () => void;
};

const UIPreferencesContext = createContext<UIPreferences | null>(null);

const THEME_KEY = "aster.theme";
const PRIVACY_KEY = "aster.privacy";

/*
 * The <html> element is the source of truth for both preferences: the inline
 * script in layout.tsx stamps them there before first paint, so they are
 * already correct by the time React runs. We therefore treat the DOM as an
 * external store and subscribe to it, rather than mirroring it into state and
 * syncing with an effect.
 */
function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme", "data-privacy"],
  });
  return () => observer.disconnect();
}

const getThemeSnapshot = (): Theme =>
  document.documentElement.getAttribute("data-theme") === "dark"
    ? "dark"
    : "light";

const getPrivacySnapshot = () =>
  document.documentElement.hasAttribute("data-privacy");

// Server render and hydration both assume the defaults; the subscription
// corrects them immediately afterwards if the stored preference differs.
const getServerTheme = (): Theme => "light";
const getServerPrivacy = () => false;

/** Best-effort persistence — storage can be blocked in private modes. */
function persist(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // The toggle still works for this session.
  }
}

export function UIPreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useSyncExternalStore(
    subscribe,
    getThemeSnapshot,
    getServerTheme,
  );
  const privacyMode = useSyncExternalStore(
    subscribe,
    getPrivacySnapshot,
    getServerPrivacy,
  );

  const toggleTheme = useCallback(() => {
    const next: Theme =
      document.documentElement.getAttribute("data-theme") === "dark"
        ? "light"
        : "dark";
    document.documentElement.setAttribute("data-theme", next);
    persist(THEME_KEY, next);
  }, []);

  const togglePrivacyMode = useCallback(() => {
    const next = !document.documentElement.hasAttribute("data-privacy");
    document.documentElement.toggleAttribute("data-privacy", next);
    persist(PRIVACY_KEY, String(next));
  }, []);

  const value = useMemo(
    () => ({ theme, toggleTheme, privacyMode, togglePrivacyMode }),
    [theme, toggleTheme, privacyMode, togglePrivacyMode],
  );

  return (
    <UIPreferencesContext.Provider value={value}>
      {children}
    </UIPreferencesContext.Provider>
  );
}

export function useUIPreferences() {
  const context = useContext(UIPreferencesContext);
  if (!context) {
    throw new Error(
      "useUIPreferences must be used inside <UIPreferencesProvider>",
    );
  }
  return context;
}
