import type { Metadata } from "next";
import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

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
    <ClerkProvider
        appearance={{
          baseTheme: dark,
          variables: {
            colorPrimary: "#171717",
            colorBackground: "#ffffff",
            colorText: "#171717",
            colorTextSecondary: "#737373",
            colorInputBackground: "#ffffff",
            colorInputText: "#171717",
            borderRadius: "0.5rem",
          },
          elements: {
            card: "shadow-lg border",
            formButtonPrimary: "bg-primary hover:bg-primary/90",
            footerActionLink: "text-primary hover:text-primary/90",
          },
        }}
      >
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
