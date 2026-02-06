"use client";

import { useEffect, useRef } from "react";

interface BannerAdProps {
  slot: string;
  format?: "auto" | "horizontal" | "vertical" | "rectangle";
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function BannerAd({ slot, format = "auto", className }: BannerAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    // Only initialize once
    if (initialized.current) return;
    initialized.current = true;

    // Check if AdSense is configured
    const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
    if (!clientId) {
      console.log("AdSense not configured");
      return;
    }

    // Push the ad
    try {
      const ads = window.adsbygoogle || [];
      window.adsbygoogle = ads;
      ads.push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;

  // Don't render if AdSense is not configured
  if (!clientId) {
    return null;
  }

  return (
    <div className={className}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export function SidebarAd() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT;

  // Show placeholder if AdSense is not fully configured
  if (!clientId || !slotId) {
    return (
      <div className="p-3 bg-muted/30 rounded-lg text-center">
        <p className="text-xs text-muted-foreground">
          Upgrade to Pro for an ad-free experience
        </p>
      </div>
    );
  }

  return (
    <BannerAd
      slot={slotId}
      format="rectangle"
      className="w-full"
    />
  );
}

export function ContentBannerAd() {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_BANNER_SLOT;

  // Show placeholder if AdSense is not fully configured
  if (!clientId || !slotId) {
    return (
      <div className="fixed bottom-0 left-64 right-0 h-[60px] bg-muted/50 border-t flex items-center justify-center">
        <p className="text-xs text-muted-foreground">
          Upgrade to Pro for an ad-free experience
        </p>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-64 right-0 h-[60px] bg-background border-t">
      <BannerAd
        slot={slotId}
        format="horizontal"
        className="h-full"
      />
    </div>
  );
}
