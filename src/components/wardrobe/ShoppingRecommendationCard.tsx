"use client";

import { useState } from "react";
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
  isPro?: boolean;
}

function buildAmazonSearchUrl(query: string, tag: string): string {
  const params = new URLSearchParams({
    k: query,
    tag,
  });
  return `https://www.amazon.com/s?${params.toString()}`;
}

const CATEGORY_IMAGES: Record<string, string> = {
  "Suits": "/images/categories/suits.jpg",
  "Structured Blazers/Jackets": "/images/categories/blazers.jpg",
  "Casual Jackets": "/images/categories/blazers.jpg",
  "Dress Shirts": "/images/categories/dress-shirts.jpg",
  "Casual Long-Sleeve Shirts": "/images/categories/dress-shirts.jpg",
  "Short-Sleeve Button-Ups": "/images/categories/polos.jpg",
  "Polos": "/images/categories/polos.jpg",
  "T-Shirts": "/images/categories/tshirts.jpg",
  "Sweaters/Knits": "/images/categories/sweaters.jpg",
  "Dress Pants": "/images/categories/dress-pants.jpg",
  "Chinos": "/images/categories/chinos.jpg",
  "Jeans": "/images/categories/jeans.jpg",
  "Shorts": "/images/categories/shorts.jpg",
  "Dress Shoes": "/images/categories/dress-shoes.jpg",
  "Casual Shoes": "/images/categories/casual-shoes.jpg",
  "Boots": "/images/categories/boots.jpg",
  "Athletic Shoes": "/images/categories/athletic-shoes.jpg",
  "Formal Shoes": "/images/categories/dress-shoes.jpg",
  "Outerwear": "/images/categories/outerwear.jpg",
  "Accessories": "/images/categories/accessories.jpg",
};

export function ShoppingRecommendationCard({
  recommendation,
  isPro,
}: ShoppingRecommendationCardProps) {
  const [imgError, setImgError] = useState(false);
  const tag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG || "outfitiq-20";
  const url = buildAmazonSearchUrl(recommendation.searchQuery, tag);
  const imageSrc = CATEGORY_IMAGES[recommendation.category];

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary"
      onClick={() => {
        window.open(url, "_blank", "noopener,noreferrer");
        fetch("/api/shopping-recommendations/click", { method: "POST" }).catch(() => {});
      }}
    >
      <div className="aspect-square relative bg-muted">
        {imageSrc && !imgError ? (
          <img
            src={imageSrc}
            alt={recommendation.title}
            className="h-full w-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
            <p className="text-muted-foreground/60 text-sm font-medium">
              {recommendation.category}
            </p>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <Badge
          className="absolute top-2 left-2 text-[10px] px-1.5 py-0 bg-black/50 text-white border-0 backdrop-blur-sm"
        >
          {isPro ? "AI Pick" : "Suggested"}
        </Badge>
        <ExternalLink className="absolute top-2 right-2 h-3.5 w-3.5 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-white text-xs line-clamp-2 drop-shadow-md">
            {recommendation.description}
          </p>
        </div>
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
