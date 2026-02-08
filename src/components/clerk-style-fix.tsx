"use client";

import { useEffect } from "react";

export function ClerkStyleFix() {
  useEffect(() => {
    // Function to fix Clerk button styles
    const fixClerkStyles = () => {
      const buttons = document.querySelectorAll(
        'button.cl-profileSectionPrimaryButton__emailAddresses, button.cl-profileSectionPrimaryButton__phoneNumbers, button.cl-profileSectionPrimaryButton__connectedAccounts'
      );

      buttons.forEach((button) => {
        const el = button as HTMLElement;
        const isDark = document.documentElement.classList.contains("dark");

        if (isDark) {
          el.style.setProperty("background-color", "#3d3730", "important");
          el.style.setProperty("color", "#f5f5f0", "important");
          el.style.setProperty("border-color", "#4d473f", "important");
        } else {
          el.style.setProperty("background-color", "#f5f5f5", "important");
          el.style.setProperty("color", "#171717", "important");
          el.style.setProperty("border-color", "#e5e5e5", "important");
        }
      });
    };

    // Run on mount
    fixClerkStyles();

    // Set up a MutationObserver to catch when Clerk renders/updates
    const observer = new MutationObserver(() => {
      fixClerkStyles();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "style"],
    });

    // Also listen for theme changes
    const htmlObserver = new MutationObserver(() => {
      fixClerkStyles();
    });

    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      observer.disconnect();
      htmlObserver.disconnect();
    };
  }, []);

  return null;
}
