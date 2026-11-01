"use client";

import { useSyncExternalStore } from "react";

export type Locale = "vi" | "en";

const storageKey = "toolhub_locale";
const changedEvent = "toolhub:locale-change";

function getLocale(): Locale {
  try {
    const saved = window.localStorage.getItem(storageKey);
    if (saved === "vi" || saved === "en") return saved;
    return "vi";
  } catch {
    return "vi";
  }
}

function subscribe(changed: () => void) {
  const storageChanged = (event: StorageEvent) => {
    if (event.key === storageKey || event.key === null) changed();
  };
  window.addEventListener("storage", storageChanged);
  window.addEventListener(changedEvent, changed);
  return () => {
    window.removeEventListener("storage", storageChanged);
    window.removeEventListener(changedEvent, changed);
  };
}

export function useLocale() {
  const locale = useSyncExternalStore(
    subscribe,
    getLocale,
    () => "vi" as const,
  );
  return locale;
}
