"use client";

import { useEffect } from "react";

export function ClerkStyleFix() {
  useEffect(() => {
    let isFixing = false;

    // Navy theme colors
    const navyTheme = {
      bg: "#1a1a2e",
      bgDark: "#0f0f1a",
      bgLight: "#252540",
      text: "#f0ece4",
      textMuted: "#8a8a9a",
      border: "#2a2a45",
      gold: "#dfc08a",
    };

    // Function to fix Clerk styles
    const fixClerkStyles = () => {
      if (isFixing) return;
      isFixing = true;

      const isDark = document.documentElement.classList.contains("dark") ||
                     document.querySelector('.dark') !== null;

      if (!isDark) {
        isFixing = false;
        return;
      }

      // Nuclear option: Fix ALL elements inside Clerk components
      const allClerkElements = document.querySelectorAll('[class*="cl-"]');
      allClerkElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const className = htmlEl.className || '';

        // Skip SVGs and images
        if (htmlEl.tagName === 'SVG' || htmlEl.tagName === 'IMG' || htmlEl.tagName === 'PATH') {
          return;
        }

        // Primary buttons get gold
        if (className.includes('formButtonPrimary') || className.includes('ButtonPrimary')) {
          htmlEl.style.setProperty("background-color", navyTheme.gold, "important");
          htmlEl.style.setProperty("color", navyTheme.bgDark, "important");
          return;
        }

        // Inputs get lighter navy
        if (className.includes('Input') || className.includes('input') || htmlEl.tagName === 'INPUT') {
          htmlEl.style.setProperty("background-color", navyTheme.bgLight, "important");
          htmlEl.style.setProperty("border-color", navyTheme.border, "important");
          htmlEl.style.setProperty("color", navyTheme.text, "important");
          return;
        }

        // Links get gold
        if (className.includes('Link') || className.includes('link') || htmlEl.tagName === 'A') {
          if (className.includes('footer') || className.includes('Footer')) {
            htmlEl.style.setProperty("color", navyTheme.gold, "important");
          }
          return;
        }

        // Everything else gets navy background
        htmlEl.style.setProperty("background-color", navyTheme.bg, "important");
        htmlEl.style.setProperty("border-color", navyTheme.border, "important");
      });

      // Also fix any div inside clerk root that might have inline styles
      const clerkRoots = document.querySelectorAll('.cl-rootBox, .cl-signIn-root, .cl-signUp-root, .cl-card');
      clerkRoots.forEach((root) => {
        root.querySelectorAll('div').forEach((div) => {
          const htmlEl = div as HTMLElement;
          htmlEl.style.setProperty("background-color", navyTheme.bg, "important");
        });
      });

      // Fix text colors
      const textElements = document.querySelectorAll('.cl-headerTitle, .cl-headerSubtitle, .cl-dividerText, .cl-formFieldLabel, .cl-footerActionText, [class*="cl-"] span, [class*="cl-"] p');
      textElements.forEach((text) => {
        const el = text as HTMLElement;
        el.style.setProperty("color", navyTheme.text, "important");
      });

      // Fix social buttons specifically (need lighter bg)
      const socialButtons = document.querySelectorAll('.cl-socialButtonsBlockButton, .cl-socialButtonsIconButton');
      socialButtons.forEach((btn) => {
        const el = btn as HTMLElement;
        el.style.setProperty("background-color", navyTheme.bgLight, "important");
        el.style.setProperty("border-color", navyTheme.border, "important");
        el.style.setProperty("color", navyTheme.text, "important");
      });

      // Fix footer action link color
      const footerLinks = document.querySelectorAll('.cl-footerActionLink, [class*="footerActionLink"]');
      footerLinks.forEach((link) => {
        const el = link as HTMLElement;
        el.style.setProperty("color", navyTheme.gold, "important");
        el.style.setProperty("background-color", "transparent", "important");
      });

      const bgColor = navyTheme.bgLight;
      const bgMain = navyTheme.bg;
      const textColor = navyTheme.text;
      const borderColor = navyTheme.border;

      // Fix add email/phone buttons (profile modal)
      const addButtons = document.querySelectorAll(
        'button.cl-profileSectionPrimaryButton__emailAddresses, button.cl-profileSectionPrimaryButton__phoneNumbers, button.cl-profileSectionPrimaryButton__connectedAccounts'
      );

      addButtons.forEach((button) => {
        const el = button as HTMLElement;
        el.style.setProperty("background-color", bgColor, "important");
        el.style.setProperty("color", textColor, "important");
        el.style.setProperty("border-color", borderColor, "important");

        el.querySelectorAll("*").forEach((child) => {
          const childEl = child as HTMLElement;
          childEl.style.setProperty("background-color", "transparent", "important");
          childEl.style.setProperty("background", "transparent", "important");
          childEl.style.setProperty("color", textColor, "important");
        });
      });

      // Fix navbar buttons (Profile, Security)
      const navButtons = document.querySelectorAll('.cl-navbarButton');
      navButtons.forEach((button) => {
        const el = button as HTMLElement;
        el.style.setProperty("background-color", "transparent", "important");
        el.style.setProperty("color", textColor, "important");

        el.querySelectorAll("*").forEach((child) => {
          const childEl = child as HTMLElement;
          childEl.style.setProperty("background-color", "transparent", "important");
          childEl.style.setProperty("background", "transparent", "important");
          childEl.style.setProperty("color", textColor, "important");
        });
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
