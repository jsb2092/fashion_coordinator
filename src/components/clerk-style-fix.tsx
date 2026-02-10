"use client";

import { useEffect } from "react";

export function ClerkStyleFix() {
  useEffect(() => {
    // Navy theme colors for dark mode profile modal
    const navy = {
      bg: "#1a1a2e",
      bgLight: "#252540",
      text: "#f0ece4",
      border: "#2a2a45",
      gold: "#dfc08a",
      bgDark: "#0f0f1a",
    };

    // Only fix styles when in dark mode (for profile modal)
    const fixStyles = () => {
      const isDark = document.documentElement.classList.contains("dark");
      if (!isDark) return;

      // Fix profile modal
      document.querySelectorAll(".cl-userProfile-root").forEach((root) => {
        const el = root as HTMLElement;
        el.style.setProperty("background-color", navy.bg, "important");

        // Fix all descendants
        el.querySelectorAll("*").forEach((child) => {
          const childEl = child as HTMLElement;
          if (childEl.tagName === "SVG" || childEl.tagName === "IMG") return;

          const className = childEl.className || "";

          // Primary buttons get gold
          if (className.includes("Primary") || className.includes("formButtonPrimary")) {
            childEl.style.setProperty("background-color", navy.gold, "important");
            childEl.style.setProperty("color", navy.bgDark, "important");
          } else if (childEl.tagName === "INPUT") {
            childEl.style.setProperty("background-color", navy.bgLight, "important");
            childEl.style.setProperty("border-color", navy.border, "important");
            childEl.style.setProperty("color", navy.text, "important");
          } else {
            childEl.style.setProperty("background-color", navy.bg, "important");
            childEl.style.setProperty("color", navy.text, "important");
          }
        });
      });

      // Fix navbar buttons
      document.querySelectorAll(".cl-navbarButton").forEach((btn) => {
        const el = btn as HTMLElement;
        el.style.setProperty("color", navy.text, "important");
        el.style.setProperty("background-color", "transparent", "important");
      });
    };

    fixStyles();
    const observer = new MutationObserver(fixStyles);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
