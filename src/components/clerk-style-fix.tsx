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

      // Fix auth cards (sign-in, sign-up)
      const cards = document.querySelectorAll('.cl-card, .cl-signIn-root, .cl-signUp-root, .cl-rootBox');
      cards.forEach((card) => {
        const el = card as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("background-color", navyTheme.bg, "important");
          el.style.setProperty("border-color", navyTheme.border, "important");
        }
      });

      // Fix card boxes and content
      const cardBoxes = document.querySelectorAll('.cl-cardBox, .cl-main, .cl-footer, .cl-footerAction');
      cardBoxes.forEach((box) => {
        const el = box as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("background-color", navyTheme.bg, "important");
        }
      });

      // Fix ALL footer elements (including "Secured by clerk")
      const footerElements = document.querySelectorAll('[class*="cl-footer"], [class*="cl-internal-"]');
      footerElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (isDark || htmlEl.closest('.dark')) {
          const classList = htmlEl.className;
          if (classList.includes('footer') || classList.includes('Footer')) {
            htmlEl.style.setProperty("background-color", navyTheme.bg, "important");
          }
        }
      });

      // Fix text colors
      const textElements = document.querySelectorAll('.cl-headerTitle, .cl-headerSubtitle, .cl-dividerText, .cl-formFieldLabel, .cl-footerActionText');
      textElements.forEach((text) => {
        const el = text as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("color", navyTheme.text, "important");
        }
      });

      // Fix inputs and their containers
      const inputs = document.querySelectorAll('.cl-formFieldInput, .cl-input, [class*="cl-formFieldInput"]');
      inputs.forEach((input) => {
        const el = input as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("background-color", navyTheme.bgLight, "important");
          el.style.setProperty("border-color", navyTheme.border, "important");
          el.style.setProperty("color", navyTheme.text, "important");
        }
      });

      // Fix input group wrappers
      const inputGroups = document.querySelectorAll('[class*="formFieldInputGroup"], [class*="formFieldRow"], [class*="inputGroup"]');
      inputGroups.forEach((group) => {
        const el = group as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("background-color", navyTheme.bgLight, "important");
          el.style.setProperty("border-color", navyTheme.border, "important");
        }
      });

      // Fix social buttons
      const socialButtons = document.querySelectorAll('.cl-socialButtonsBlockButton, .cl-socialButtonsIconButton');
      socialButtons.forEach((btn) => {
        const el = btn as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("background-color", navyTheme.bgLight, "important");
          el.style.setProperty("border-color", navyTheme.border, "important");
          el.style.setProperty("color", navyTheme.text, "important");
        }
      });

      // Fix primary buttons (Continue, etc.)
      const primaryButtons = document.querySelectorAll('.cl-formButtonPrimary');
      primaryButtons.forEach((btn) => {
        const el = btn as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("background-color", navyTheme.gold, "important");
          el.style.setProperty("color", navyTheme.bgDark, "important");
        }
      });

      // Fix footer links
      const footerLinks = document.querySelectorAll('.cl-footerActionLink');
      footerLinks.forEach((link) => {
        const el = link as HTMLElement;
        if (isDark || el.closest('.dark')) {
          el.style.setProperty("color", navyTheme.gold, "important");
        }
      });

      // Fix "Secured by Clerk" and any internal footer elements
      const internalElements = document.querySelectorAll('[class*="cl-internal"]');
      internalElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (isDark || htmlEl.closest('.dark')) {
          // Check if it's in a footer context or has a gray-ish background
          const computed = window.getComputedStyle(htmlEl);
          const bg = computed.backgroundColor;
          // If it has any non-transparent background that isn't navy, fix it
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)' &&
              !bg.includes('26, 26, 46') && !bg.includes('15, 15, 26')) {
            htmlEl.style.setProperty("background-color", navyTheme.bg, "important");
          }
        }
      });

      const bgColor = isDark ? navyTheme.bgLight : "#f5f5f5";
      const bgMain = isDark ? navyTheme.bg : "#ffffff";
      const textColor = isDark ? navyTheme.text : "#171717";
      const borderColor = isDark ? navyTheme.border : "#e5e5e5";

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
