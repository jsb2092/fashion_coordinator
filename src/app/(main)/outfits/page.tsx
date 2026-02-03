import { Suspense } from "react";
import Link from "next/link";
import { getOutfits } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OCCASION_TYPES, FORMALITY_LEVELS } from "@/constants/categories";

async function OutfitsContent() {
  const outfits = await getOutfits();

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {outfits.map((outfit) => {
        const occasionLabel =
          OCCASION_TYPES.find((o) => o.value === outfit.occasionType)?.label ||
          outfit.occasionType;
        const formalityLabel =
          FORMALITY_LEVELS.find((f) => f.value === outfit.formalityScore)
            ?.label || "";

        return (
          <Card key={outfit.id} className="overflow-hidden">
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
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-xs">
                        {item.wardrobeItem.category}
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
  );
}

function OutfitsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <Skeleton className="aspect-video" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function OutfitsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Outfits</h1>
          <p className="text-muted-foreground">
            Saved outfit combinations
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/chat">
            <Button variant="outline">
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
              Ask Claude
            </Button>
          </Link>
          <Link href="/outfits/new">
            <Button>
              <svg
                className="h-4 w-4 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 4.5v15m7.5-7.5h-15"
                />
              </svg>
              Create Outfit
            </Button>
          </Link>
        </div>
      </div>
      <Suspense fallback={<OutfitsSkeleton />}>
        <OutfitsContent />
      </Suspense>
    </div>
  );
}
