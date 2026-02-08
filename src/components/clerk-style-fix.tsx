"use client";

import { useEffect } from "react";

export function ClerkStyleFix() {
  useEffect(() => {
    let isFixing = false;

    // Function to fix Clerk button styles
    const fixClerkStyles = () => {
      if (isFixing) return;
      isFixing = true;

      const buttons = document.querySelectorAll(
        'button.cl-profileSectionPrimaryButton__emailAddresses, button.cl-profileSectionPrimaryButton__phoneNumbers, button.cl-profileSectionPrimaryButton__connectedAccounts'
      );

      const isDark = document.documentElement.classList.contains("dark");
      const bgColor = isDark ? "#3d3730" : "#f5f5f5";
      const textColor = isDark ? "#f5f5f0" : "#171717";
      const borderColor = isDark ? "#4d473f" : "#e5e5e5";

      buttons.forEach((button) => {
        const el = button as HTMLElement;

        // Only update if not already set correctly
        if (el.style.backgroundColor !== bgColor) {
          el.style.setProperty("background-color", bgColor, "important");
          el.style.setProperty("color", textColor, "important");
          el.style.setProperty("border-color", borderColor, "important");

          // Also fix all child elements to have transparent background
          el.querySelectorAll("*").forEach((child) => {
            const childEl = child as HTMLElement;
            childEl.style.setProperty("background-color", "transparent", "important");
            childEl.style.setProperty("background", "transparent", "important");
            childEl.style.setProperty("color", textColor, "important");
          });
        }
      });

      isFixing = false;
    };

    // Run on mount
    fixClerkStyles();

    // Set up a MutationObserver to catch when Clerk renders/updates
    // Only watch for childList changes, not attribute/style changes
    const observer = new MutationObserver(() => {
      fixClerkStyles();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Also listen for theme changes on html element
    const htmlObserver = new MutationObserver(() => {
      // Force re-check all buttons when theme changes
      const buttons = document.querySelectorAll(
        'button.cl-profileSectionPrimaryButton__emailAddresses, button.cl-profileSectionPrimaryButton__phoneNumbers, button.cl-profileSectionPrimaryButton__connectedAccounts'
      );
      buttons.forEach((el) => {
        (el as HTMLElement).style.backgroundColor = "";
      });
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
