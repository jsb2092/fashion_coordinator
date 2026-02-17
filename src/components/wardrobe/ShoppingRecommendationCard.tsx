"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, ExternalLink } from "lucide-react";
import type { ShoppingRecommendation } from "@/lib/claude";

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

export function ShoppingRecommendationCard({
  recommendation,
}: ShoppingRecommendationCardProps) {
  const tag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;
  if (!tag) return null;

  const url = buildAmazonSearchUrl(recommendation.searchQuery, tag);

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary"
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
    >
      <div className="aspect-square relative bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
        <Badge
          variant="secondary"
          className="absolute top-2 right-2 text-[10px] px-1.5 py-0"
        >
          Suggested
        </Badge>
        <ExternalLink className="absolute bottom-2 right-2 h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{recommendation.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {recommendation.suggestedColor} · {recommendation.category}
        </p>
      </div>
    </Card>
  );
}
