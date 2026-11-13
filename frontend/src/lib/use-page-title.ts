"use client";

import { useLayoutEffect } from "react";

export function usePageTitle(title: string) {
  useLayoutEffect(() => {
    const syncTitle = () => {
      const element = document.head.querySelector("title");
      if (element && element.textContent !== title) element.textContent = title;
    };
    syncTitle();
    const observer = new MutationObserver(syncTitle);
    observer.observe(document.head, {
      childList: true,
      characterData: true,
      subtree: true,
    });
    return () => observer.disconnect();
  }, [title]);
}
