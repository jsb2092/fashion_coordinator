"use client";

import { useEffect } from "react";

export function ClerkStyleFix() {
  useEffect(() => {
    // Navy theme colors
    const navy = {
      bg: "#1a1a2e",
      bgDark: "#0f0f1a",
      bgLight: "#252540",
      text: "#f0ece4",
      border: "#2a2a45",
      gold: "#dfc08a",
    };

    // Inject CSS for Clerk styling
    const styleId = "clerk-navy-fix";
    let style = document.getElementById(styleId) as HTMLStyleElement;
    if (!style) {
      style = document.createElement("style");
      style.id = styleId;
      document.head.appendChild(style);
    }

    style.textContent = `
      /* Containers */
      .cl-card, .cl-cardBox, .cl-rootBox, .cl-main,
      .cl-footer, .cl-footerAction, .cl-signIn-root, .cl-signUp-root {
        background-color: ${navy.bg} !important;
      }

      /* Primary button */
      .cl-formButtonPrimary {
        background-color: ${navy.gold} !important;
        color: ${navy.bgDark} !important;
      }

      /* Inputs */
      .cl-formFieldInput, .cl-input {
        background-color: ${navy.bgLight} !important;
        border-color: ${navy.border} !important;
        color: ${navy.text} !important;
      }

      /* Social buttons */
      .cl-socialButtonsBlockButton {
        background-color: ${navy.bgLight} !important;
        border-color: ${navy.border} !important;
      }

      /* Text */
      .cl-headerTitle, .cl-headerSubtitle, .cl-formFieldLabel,
      .cl-footerActionText, .cl-dividerText {
        color: ${navy.text} !important;
      }

      /* Footer link */
      .cl-footerActionLink {
        color: ${navy.gold} !important;
      }

      /* Profile modal */
      .cl-userProfile-root, .cl-userProfile-root * {
        background-color: ${navy.bg} !important;
        color: ${navy.text} !important;
      }
      .cl-userProfile-root .cl-formButtonPrimary,
      .cl-userProfile-root .cl-profileSectionPrimaryButton {
        background-color: ${navy.gold} !important;
        color: ${navy.bgDark} !important;
      }
      .cl-userProfile-root input {
        background-color: ${navy.bgLight} !important;
        border-color: ${navy.border} !important;
      }
      .cl-navbarButton {
        color: ${navy.text} !important;
      }
    `;

    // JS fix for elements CSS can't reach
    const fixStyles = () => {
      // Fix primary buttons
      document.querySelectorAll(".cl-formButtonPrimary").forEach((btn) => {
        const el = btn as HTMLElement;
        el.style.setProperty("background-color", navy.gold, "important");
        el.style.setProperty("color", navy.bgDark, "important");
      });

      // Fix profile modal buttons
      document.querySelectorAll(".cl-profileSectionPrimaryButton").forEach((btn) => {
        const el = btn as HTMLElement;
        el.style.setProperty("background-color", navy.bgLight, "important");
        el.style.setProperty("color", navy.text, "important");
      });
    };

    // Run fix and observe for changes
    fixStyles();
    const observer = new MutationObserver(fixStyles);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  return null;
}
