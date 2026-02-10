"use client";

import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force dark mode on html element for Clerk components
  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => {
      // Don't remove - let ThemeProvider handle it
    };
  }, []);

  return <div className="min-h-screen bg-[#0f0f1a]">{children}</div>;
}
