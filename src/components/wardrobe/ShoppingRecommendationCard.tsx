"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

interface ShoppingRecommendation {
  searchQuery: string;
  category: string;
  suggestedColor: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface ShoppingRecommendationCardProps {
  recommendation: ShoppingRecommendation;
}

function buildAmazonSearchUrl(query: string, tag: string): string {
  const params = new URLSearchParams({
    k: query,
    tag,
  });
  return `https://www.amazon.com/s?${params.toString()}`;
}

// Map common color names to CSS colors for the gradient
function colorToCSS(color: string): string {
  const c = color.toLowerCase();
  const map: Record<string, string> = {
    navy: "#1e3a5f",
    "navy blue": "#1e3a5f",
    black: "#1a1a1a",
    white: "#e8e8e8",
    "off-white": "#f0ece2",
    cream: "#f5f0e1",
    grey: "#6b6b6b",
    gray: "#6b6b6b",
    charcoal: "#36454f",
    "charcoal grey": "#36454f",
    burgundy: "#722f37",
    olive: "#556b2f",
    "olive green": "#556b2f",
    khaki: "#c3b091",
    tan: "#d2b48c",
    camel: "#c19a6b",
    brown: "#5c4033",
    "dark brown": "#3e2723",
    "light brown": "#a0785a",
    blue: "#2563eb",
    "light blue": "#93c5fd",
    red: "#b91c1c",
    green: "#166534",
    pink: "#ec4899",
    lavender: "#9f8fdb",
    beige: "#d4c5a9",
    coral: "#f08080",
    teal: "#0d9488",
    rust: "#a0522d",
    plum: "#673147",
    sage: "#9caf88",
    "sage green": "#9caf88",
    stone: "#a09683",
    slate: "#5a6478",
    indigo: "#3f51b5",
    cobalt: "#0047ab",
    maroon: "#5c1a1a",
    cognac: "#9a6233",
  };

  // Check exact match first, then partial matches
  if (map[c]) return map[c];
  for (const [key, value] of Object.entries(map)) {
    if (c.includes(key)) return value;
  }
  return "#6366f1"; // Default indigo
}

export function ShoppingRecommendationCard({
  recommendation,
}: ShoppingRecommendationCardProps) {
  const tag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "outfitiq-20";
  const url = buildAmazonSearchUrl(recommendation.searchQuery, tag);
  const bgColor = colorToCSS(recommendation.suggestedColor);

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary"
      onClick={() => {
        window.open(url, "_blank", "noopener,noreferrer");
        fetch("/api/shopping-recommendations/click", { method: "POST" }).catch(() => {});
      }}
    >
      <div
        className="aspect-square relative flex flex-col items-center justify-center p-4 text-center"
        style={{
          background: `linear-gradient(135deg, ${bgColor}dd, ${bgColor}99)`,
        }}
      >
        <p className="font-semibold text-white text-sm leading-tight drop-shadow-md">
          {recommendation.title}
        </p>
        <p className="text-white/80 text-xs mt-1.5 line-clamp-2 drop-shadow-sm">
          {recommendation.description}
        </p>
        <Badge
          className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-white/20 text-white border-white/30 backdrop-blur-sm"
        >
          Suggested
        </Badge>
        <ExternalLink className="absolute bottom-2 right-2 h-3.5 w-3.5 text-white/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{recommendation.category}</p>
        <p className="text-xs text-muted-foreground truncate">
          {recommendation.suggestedColor}
        </p>
      </div>
    </Card>
  );
}
