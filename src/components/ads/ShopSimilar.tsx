import { WardrobeItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

interface ShopSimilarProps {
  item: WardrobeItem;
}

function buildAmazonSearchUrl(query: string, tag: string): string {
  const params = new URLSearchParams({
    k: query,
    tag,
  });
  return `https://www.amazon.com/s?${params.toString()}`;
}

export function ShopSimilar({ item }: ShopSimilarProps) {
  const tag = process.env.NEXT_PUBLIC_AMAZON_AFFILIATE_TAG;
  if (!tag) return null;

  const category = item.subcategory || item.category;
  const colorQuery = `${item.colorPrimary} ${category}`.trim();
  const brandQuery = item.brand ? `${item.brand} ${category}`.trim() : null;

  return (
    <div className="pt-2 border-t">
      <p className="text-xs text-muted-foreground mb-2">Shop similar</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
          <a
            href={buildAmazonSearchUrl(colorQuery, tag)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {colorQuery}
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
        {brandQuery && (
          <Button variant="outline" size="sm" className="h-7 text-xs" asChild>
            <a
              href={buildAmazonSearchUrl(brandQuery, tag)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {brandQuery}
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}
