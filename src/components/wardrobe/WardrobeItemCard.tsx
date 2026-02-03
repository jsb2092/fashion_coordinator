"use client";

import { WardrobeItem } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FORMALITY_LEVELS } from "@/constants/categories";

interface WardrobeItemCardProps {
  item: WardrobeItem;
  onClick?: () => void;
}

export function WardrobeItemCard({ item, onClick }: WardrobeItemCardProps) {
  const formalityLabel =
    FORMALITY_LEVELS.find((f) => f.value === item.formalityLevel)?.label ||
    "Unknown";

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary"
      onClick={onClick}
    >
      <div className="aspect-square relative bg-muted">
        {item.photoUrls[0] ? (
          <img
            src={item.photoUrls[0]}
            alt={`${item.category} - ${item.colorPrimary}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="secondary" className="text-xs">
            {formalityLabel}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{item.category}</p>
        <p className="text-xs text-muted-foreground truncate">
          {item.colorPrimary}
          {item.subcategory && ` · ${item.subcategory}`}
        </p>
      </div>
    </Card>
  );
}
