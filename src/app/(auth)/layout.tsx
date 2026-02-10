"use client";

import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Force light mode on auth pages
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";

    return () => {
      // Restore when leaving auth pages
      document.documentElement.style.colorScheme = "";
    };
  }, []);

  return <>{children}</>;
}
