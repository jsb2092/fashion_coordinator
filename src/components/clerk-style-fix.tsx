"use client";

import { useEffect } from "react";

export function ClerkStyleFix() {
  useEffect(() => {
    let isFixing = false;

    // Function to fix Clerk button styles
    const fixClerkStyles = () => {
      if (isFixing) return;
      isFixing = true;

      const isDark = document.documentElement.classList.contains("dark");
      const bgColor = isDark ? "#3d3730" : "#f5f5f5";
      const bgMain = isDark ? "#2a2520" : "#ffffff";
      const textColor = isDark ? "#f5f5f0" : "#171717";
      const borderColor = isDark ? "#4d473f" : "#e5e5e5";

      // Fix add email/phone buttons
      const addButtons = document.querySelectorAll(
        'button.cl-profileSectionPrimaryButton__emailAddresses, button.cl-profileSectionPrimaryButton__phoneNumbers, button.cl-profileSectionPrimaryButton__connectedAccounts'
      );

      addButtons.forEach((button) => {
        const el = button as HTMLElement;
        if (el.dataset.clerkFixed !== "true") {
          el.style.setProperty("background-color", bgColor, "important");
          el.style.setProperty("color", textColor, "important");
          el.style.setProperty("border-color", borderColor, "important");
          el.dataset.clerkFixed = "true";

          el.querySelectorAll("*").forEach((child) => {
            const childEl = child as HTMLElement;
            childEl.style.setProperty("background-color", "transparent", "important");
            childEl.style.setProperty("background", "transparent", "important");
            childEl.style.setProperty("color", textColor, "important");
          });
        }
      });

      // Fix navbar buttons (Profile, Security)
      const navButtons = document.querySelectorAll('.cl-navbarButton');
      navButtons.forEach((button) => {
        const el = button as HTMLElement;
        if (el.dataset.clerkFixed !== "true") {
          el.style.setProperty("background-color", "transparent", "important");
          el.style.setProperty("color", textColor, "important");
          el.dataset.clerkFixed = "true";

          el.querySelectorAll("*").forEach((child) => {
            const childEl = child as HTMLElement;
            childEl.style.setProperty("background-color", "transparent", "important");
            childEl.style.setProperty("background", "transparent", "important");
            childEl.style.setProperty("color", textColor, "important");
          });
        }
      });

      // Fix navbar container
      const navbar = document.querySelectorAll('.cl-navbar, .cl-navbarButtons');
      navbar.forEach((el) => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.setProperty("background-color", bgMain, "important");
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
      // Reset all fixed elements when theme changes
      document.querySelectorAll('[data-clerk-fixed]').forEach((el) => {
        delete (el as HTMLElement).dataset.clerkFixed;
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
