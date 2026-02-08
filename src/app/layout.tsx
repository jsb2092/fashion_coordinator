import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Use CSS variables so Clerk responds to theme changes
const clerkAppearance = {
  variables: {
    colorBackground: "var(--clerk-bg)",
    colorText: "var(--clerk-text)",
    colorTextSecondary: "var(--clerk-text-secondary)",
    colorInputBackground: "var(--clerk-bg-secondary)",
    colorInputText: "var(--clerk-text)",
    colorPrimary: "var(--clerk-btn-bg)",
  },
  elements: {
    card: {
      backgroundColor: "var(--clerk-bg)",
      color: "var(--clerk-text)",
    },
    navbar: {
      backgroundColor: "var(--clerk-bg)",
    },
    navbarButton: {
      color: "var(--clerk-text)",
    },
    pageScrollBox: {
      backgroundColor: "var(--clerk-bg)",
    },
    page: {
      backgroundColor: "var(--clerk-bg)",
    },
    profileSection: {
      backgroundColor: "var(--clerk-bg)",
    },
    profileSectionContent: {
      backgroundColor: "var(--clerk-bg)",
    },
    formFieldInput: {
      backgroundColor: "var(--clerk-bg-secondary)",
      borderColor: "var(--clerk-border)",
    },
    formButtonPrimary: {
      backgroundColor: "var(--clerk-btn-bg)",
      color: "var(--clerk-btn-text)",
    },
    profileSectionPrimaryButton: {
      backgroundColor: "var(--clerk-btn-bg)",
      color: "var(--clerk-btn-text)",
    },
    actionCard: {
      backgroundColor: "var(--clerk-bg-secondary)",
      borderColor: "var(--clerk-border)",
    },
    alternativeMethodsBlockButton: {
      backgroundColor: "var(--clerk-bg-secondary)",
      color: "var(--clerk-text)",
      borderColor: "var(--clerk-border)",
    },
    otpCodeFieldInput: {
      backgroundColor: "var(--clerk-bg-secondary)",
      borderColor: "var(--clerk-border)",
      color: "var(--clerk-text)",
    },
    menuList: {
      backgroundColor: "var(--clerk-bg)",
    },
    menuItem: {
      backgroundColor: "var(--clerk-bg)",
      color: "var(--clerk-text)",
    },
    badge: {
      backgroundColor: "var(--clerk-bg-secondary)",
      color: "var(--clerk-text)",
    },
    // Target the add buttons in profile sections
    profileSectionItemList: {
      backgroundColor: "var(--clerk-bg)",
      color: "var(--clerk-text)",
    },
    "profileSectionItemList__emailAddresses": {
      backgroundColor: "var(--clerk-bg)",
      color: "var(--clerk-text)",
    },
    "profileSectionItemList__phoneNumbers": {
      backgroundColor: "var(--clerk-bg)",
      color: "var(--clerk-text)",
    },
    "profileSectionItemList__connectedAccounts": {
      backgroundColor: "var(--clerk-bg)",
      color: "var(--clerk-text)",
    },
    profileSectionItem: {
      backgroundColor: "var(--clerk-bg)",
    },
    button: {
      backgroundColor: "var(--clerk-bg-secondary)",
      color: "var(--clerk-text)",
    },
    headerTitle: {
      color: "var(--clerk-text)",
    },
    headerSubtitle: {
      color: "var(--clerk-text-secondary)",
    },
    identityPreviewText: {
      color: "var(--clerk-text)",
    },
    identityPreviewEditButtonIcon: {
      color: "var(--clerk-text)",
    },
    formFieldLabel: {
      color: "var(--clerk-text)",
    },
    accordionTriggerButton: {
      color: "var(--clerk-text)",
    },
  },
};

const adsenseClientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Outfit IQ",
  description: "AI-powered wardrobe management and outfit suggestions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en" suppressHydrationWarning>
        <head>
          {adsenseClientId && (
            <Script
              async
              src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClientId}`}
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
          )}
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
