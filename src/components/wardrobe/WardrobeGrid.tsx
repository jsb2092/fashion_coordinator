"use client";

import { useState } from "react";
import { WardrobeItem } from "@prisma/client";
import { WardrobeItemCard } from "./WardrobeItemCard";
import { ItemDetailModal } from "./ItemDetailModal";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface WardrobeGridProps {
  items: WardrobeItem[];
}

export function WardrobeGrid({ items }: WardrobeGridProps) {
  const [previewItem, setPreviewItem] = useState<WardrobeItem | null>(null);
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null);

  if (items.length === 0) {
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
              d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold">No items yet</h3>
        <p className="text-muted-foreground mt-1">
          Upload photos of your clothing to get started
        </p>
      </div>
    );
  }

  const openDetails = () => {
    if (previewItem) {
      setDetailItem(previewItem);
      setPreviewItem(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => (
          <WardrobeItemCard
            key={item.id}
            item={item}
            onClick={() => setPreviewItem(item)}
          />
        ))}
      </div>

      {/* Photo Preview Modal */}
      <Dialog open={!!previewItem} onOpenChange={(open) => !open && setPreviewItem(null)}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden">
          {previewItem && (
            <div className="flex flex-col">
              {/* Large Photo */}
              <div className="relative bg-muted flex items-center justify-center min-h-[400px] max-h-[70vh]">
                {previewItem.photoUrls[0] ? (
                  <img
                    src={previewItem.photoUrls[0]}
                    alt={previewItem.category}
                    className="max-w-full max-h-[70vh] object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <p className="text-xl font-medium">{previewItem.category}</p>
                    <p>{previewItem.colorPrimary}</p>
                  </div>
                )}
              </div>

              {/* Quick Info Bar */}
              <div className="p-4 border-t bg-background">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{previewItem.category}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge variant="outline" className="text-xs">{previewItem.colorPrimary}</Badge>
                      {previewItem.brand && (
                        <Badge variant="secondary" className="text-xs">{previewItem.brand}</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{previewItem.status}</Badge>
                    </div>
                  </div>
                  <Button onClick={openDetails} className="shrink-0">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Detail Modal */}
      <ItemDetailModal
        item={detailItem}
        isOpen={!!detailItem}
        onClose={() => setDetailItem(null)}
      />
    </>
  );
}
