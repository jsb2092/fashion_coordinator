"use client";

import { useState } from "react";
import Link from "next/link";
import { Outfit, OutfitItem, WardrobeItem } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OCCASION_TYPES, FORMALITY_LEVELS } from "@/constants/categories";
import { OutfitDetailModal } from "./OutfitDetailModal";

type OutfitWithItems = Outfit & {
  items: (OutfitItem & { wardrobeItem: WardrobeItem })[];
};

interface OutfitsGridProps {
  outfits: OutfitWithItems[];
}

export function OutfitsGrid({ outfits }: OutfitsGridProps) {
  const [selectedOutfit, setSelectedOutfit] = useState<OutfitWithItems | null>(
    null
  );

  if (outfits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 6h.008v.008H6V6z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">No outfits yet</h3>
        <p className="text-muted-foreground mt-1">
          Create your first outfit or ask Claude for suggestions
        </p>
        <div className="flex gap-3 mt-4">
          <Link href="/outfits/new">
            <Button>Create Outfit</Button>
          </Link>
          <Link href="/chat">
            <Button variant="outline">Ask Claude</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {outfits.map((outfit) => {
          const occasionLabel =
            OCCASION_TYPES.find((o) => o.value === outfit.occasionType)?.label ||
            outfit.occasionType;
          const formalityLabel =
            FORMALITY_LEVELS.find((f) => f.value === outfit.formalityScore)
              ?.label || "";

          return (
            <Card
              key={outfit.id}
              className="overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary"
              onClick={() => setSelectedOutfit(outfit)}
            >
              <div className="aspect-video bg-muted relative">
                <div className="absolute inset-0 grid grid-cols-3 gap-0.5 p-2">
                  {outfit.items.slice(0, 6).map((item) => (
                    <div
                      key={item.id}
                      className="bg-background rounded overflow-hidden"
                    >
                      {item.wardrobeItem.photoUrls[0] ? (
                        <img
                          src={item.wardrobeItem.photoUrls[0]}
                          alt={item.wardrobeItem.category}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs p-1 text-center">
                          <div>
                            <p className="font-medium">{item.wardrobeItem.category}</p>
                            <p className="text-[10px]">{item.wardrobeItem.colorPrimary}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold">{outfit.name}</h3>
                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="secondary">{occasionLabel}</Badge>
                  {formalityLabel && (
                    <Badge variant="outline">{formalityLabel}</Badge>
                  )}
                  {outfit.createdBy === "ai" && (
                    <Badge variant="default">AI</Badge>
                  )}
                </div>
                {outfit.aiReasoning && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                    {outfit.aiReasoning}
                  </p>
                )}
                <div className="flex justify-between items-center mt-3 text-xs text-muted-foreground">
                  <span>{outfit.items.length} items</span>
                  <span>Worn {outfit.timesWorn} times</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <OutfitDetailModal
        outfit={selectedOutfit}
        isOpen={!!selectedOutfit}
        onClose={() => setSelectedOutfit(null)}
      />
    </>
  );
}
