"use client";

import { useState, useEffect } from "react";
import { WardrobeItem } from "@prisma/client";
import { WardrobeItemCard } from "./WardrobeItemCard";
import { ShoppingRecommendationCard } from "./ShoppingRecommendationCard";
import { ItemDetailModal } from "./ItemDetailModal";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ITEM_STATUSES, FORMALITY_LEVELS } from "@/constants/categories";
import { updateWardrobeItem } from "@/lib/actions";
import { toast } from "sonner";

interface ShoppingRecommendation {
  searchQuery: string;
  category: string;
  suggestedColor: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
}

interface WardrobeGridProps {
  items: WardrobeItem[];
  isPro?: boolean;
}

export function WardrobeGrid({ items, isPro }: WardrobeGridProps) {
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);
  const [editItem, setEditItem] = useState<WardrobeItem | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [recommendations, setRecommendations] = useState<ShoppingRecommendation[]>([]);

  useEffect(() => {
    console.log("[WardrobeGrid] useEffect fired, isPro:", isPro, "items:", items.length);
    if (isPro || items.length < 3) return;

    console.log("[WardrobeGrid] Fetching shopping recommendations...");
    fetch("/api/shopping-recommendations", { method: "POST" })
      .then((res) => res.json())
      .then((data) => {
        console.log("[WardrobeGrid] Got response:", data);
        if (data.recommendations?.length) {
          setRecommendations(data.recommendations);
        }
      })
      .catch((err) => {
        console.error("[WardrobeGrid] Fetch error:", err);
      });
  }, [isPro, items.length]);

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!selectedItem) return;
    setIsChangingStatus(true);
    try {
      await updateWardrobeItem(selectedItem.id, { status: newStatus });
      setSelectedItem({ ...selectedItem, status: newStatus as WardrobeItem["status"] });
      toast.success(`Status changed to ${ITEM_STATUSES.find(s => s.value === newStatus)?.label || newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsChangingStatus(false);
    }
  };

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

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item, index) => {
          const elements = [
            <WardrobeItemCard
              key={item.id}
              item={item}
              onClick={() => setSelectedItem(item)}
            />,
          ];

          // Interleave a recommendation card every 5th position
          if (recommendations.length > 0 && (index + 1) % 5 === 0) {
            const recIndex = Math.floor(index / 5);
            if (recIndex < recommendations.length) {
              elements.push(
                <div
                  key={`rec-${recIndex}`}
                  className="animate-in fade-in duration-500"
                >
                  <ShoppingRecommendationCard
                    recommendation={recommendations[recIndex]}
                  />
                </div>
              );
            }
          }

          return elements;
        })}
      </div>

      {/* Combined Photo + Details Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedItem && (
            <div className="flex flex-col md:flex-row">
              {/* Photo Side */}
              <div className="md:w-1/2 bg-muted flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                {selectedItem.photoUrls[0] ? (
                  <img
                    src={selectedItem.photoUrls[0]}
                    alt={selectedItem.category}
                    className="max-w-full max-h-[50vh] md:max-h-[500px] object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <p className="text-2xl font-medium">{selectedItem.category}</p>
                    <p className="text-lg">{selectedItem.colorPrimary}</p>
                  </div>
                )}
              </div>

              {/* Details Side */}
              <div className="md:w-1/2 p-6 overflow-y-auto max-h-[50vh] md:max-h-[500px]">
                <h2 className="text-xl font-semibold mb-1">
                  {selectedItem.name || selectedItem.category}
                </h2>
                {selectedItem.name && (
                  <p className="text-sm text-muted-foreground">{selectedItem.category}</p>
                )}
                {selectedItem.subcategory && (
                  <p className="text-muted-foreground mb-4">{selectedItem.subcategory}</p>
                )}

                <div className="space-y-4">
                  {/* Quick Status Change */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">Status:</span>
                    <Select
                      value={selectedItem.status}
                      onValueChange={handleQuickStatusChange}
                      disabled={isChangingStatus}
                    >
                      <SelectTrigger className="w-[160px] h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ITEM_STATUSES.map((status) => (
                          <SelectItem key={status.value} value={status.value}>
                            {status.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Color */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">Color:</span>
                    <div className="flex gap-1">
                      <Badge variant="outline">{selectedItem.colorPrimary}</Badge>
                      {selectedItem.colorSecondary && (
                        <Badge variant="outline">{selectedItem.colorSecondary}</Badge>
                      )}
                    </div>
                  </div>

                  {/* Pattern */}
                  {selectedItem.pattern && selectedItem.pattern !== "Solid" && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">Pattern:</span>
                      <Badge variant="outline">{selectedItem.pattern}</Badge>
                    </div>
                  )}

                  {/* Brand */}
                  {selectedItem.brand && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">Brand:</span>
                      <span className="font-medium">{selectedItem.brand}</span>
                    </div>
                  )}

                  {/* Material */}
                  {selectedItem.material && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">Material:</span>
                      <span>{selectedItem.material}</span>
                    </div>
                  )}

                  {/* Formality */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">Formality:</span>
                    <span>{FORMALITY_LEVELS.find(l => l.value === selectedItem.formalityLevel)?.label || selectedItem.formalityLevel}</span>
                  </div>

                  {/* Seasons */}
                  <div className="flex items-start gap-3">
                    <span className="text-sm text-muted-foreground w-20 pt-0.5">Seasons:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedItem.seasonSuitability.map((season) => (
                        <Badge key={season} variant="secondary" className="text-xs">
                          {season.replace("_", " ")}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Notes */}
                  {selectedItem.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{selectedItem.notes}</p>
                    </div>
                  )}

                  {/* Wear Stats */}
                  <div className="pt-2 border-t text-sm text-muted-foreground">
                    <p>Worn {selectedItem.timesWorn} times</p>
                    {selectedItem.lastWorn && (
                      <p>Last worn: {new Date(selectedItem.lastWorn).toLocaleDateString()}</p>
                    )}
                  </div>

                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditItem(selectedItem);
                      setSelectedItem(null);
                    }}
                  >
                    Edit Item
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Edit Modal */}
      <ItemDetailModal
        item={editItem}
        isOpen={!!editItem}
        onClose={() => setEditItem(null)}
        startInEditMode={true}
      />
    </>
  );
}
