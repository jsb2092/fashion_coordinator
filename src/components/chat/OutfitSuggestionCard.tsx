"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface OutfitItem {
  id: string;
  category: string;
  subcategory?: string | null;
  colorPrimary: string;
  colorSecondary?: string | null;
  pattern?: string | null;
  brand?: string | null;
  material?: string | null;
  photoUrls: string[];
  notes?: string | null;
}

interface SuggestedOutfit {
  name: string;
  itemIds: string[];
  items?: OutfitItem[];
  reasoning: string;
  occasionType: string;
  formalityScore: number;
}

interface OutfitSuggestionCardProps {
  outfit: SuggestedOutfit;
  onSave: () => void;
  onRequestReplacement: (item: OutfitItem, reason: string) => void;
}

export function OutfitSuggestionCard({
  outfit,
  onSave,
  onRequestReplacement,
}: OutfitSuggestionCardProps) {
  const [selectedItem, setSelectedItem] = useState<OutfitItem | null>(null);
  const [showReasoningModal, setShowReasoningModal] = useState(false);

  return (
    <>
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold">{outfit.name}</h4>
          <Badge variant="secondary">{outfit.occasionType}</Badge>
        </div>

        {outfit.items && outfit.items.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-4">
            {outfit.items.map((item) => (
              <div
                key={item.id}
                className="cursor-pointer group"
                onClick={() => setSelectedItem(item)}
              >
                <div className="aspect-square rounded-lg overflow-hidden bg-muted relative ring-2 ring-transparent hover:ring-primary transition-all">
                  {item.photoUrls[0] ? (
                    <img
                      src={item.photoUrls[0]}
                      alt={item.category}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground p-1 text-center">
                      <div>
                        <p className="font-medium">{item.category}</p>
                        <p className="text-[10px]">{item.colorPrimary}</p>
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      View
                    </span>
                  </div>
                </div>
                <p className="text-xs text-center mt-1 truncate text-muted-foreground">
                  {item.category}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-left h-auto py-2"
            onClick={() => setShowReasoningModal(true)}
          >
            <div className="flex items-start gap-2">
              <svg
                className="w-4 h-4 mt-0.5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                />
              </svg>
              <span className="text-sm text-muted-foreground line-clamp-2">
                {outfit.reasoning}
              </span>
            </div>
          </Button>

          <Button size="sm" onClick={onSave} className="w-full">
            Save Outfit
          </Button>
        </div>
      </Card>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedItem?.category}</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              {selectedItem.photoUrls[0] ? (
                <img
                  src={selectedItem.photoUrls[0]}
                  alt={selectedItem.category}
                  className="w-full aspect-square object-cover rounded-lg"
                />
              ) : (
                <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="font-medium text-lg">{selectedItem.category}</p>
                    <p>{selectedItem.colorPrimary}</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline">{selectedItem.colorPrimary}</Badge>
                  {selectedItem.colorSecondary && (
                    <Badge variant="outline">{selectedItem.colorSecondary}</Badge>
                  )}
                  {selectedItem.pattern && selectedItem.pattern !== "Solid" && (
                    <Badge variant="outline">{selectedItem.pattern}</Badge>
                  )}
                  {selectedItem.brand && (
                    <Badge variant="secondary">{selectedItem.brand}</Badge>
                  )}
                </div>
                {selectedItem.subcategory && (
                  <p className="text-sm text-muted-foreground">
                    {selectedItem.subcategory}
                  </p>
                )}
                {selectedItem.material && (
                  <p className="text-sm">Material: {selectedItem.material}</p>
                )}
                {selectedItem.notes && (
                  <p className="text-sm text-muted-foreground">{selectedItem.notes}</p>
                )}
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onRequestReplacement(
                      selectedItem,
                      "I don't want to wear this item"
                    );
                    setSelectedItem(null);
                  }}
                >
                  Replace This Item
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    onRequestReplacement(
                      selectedItem,
                      "This doesn't work for the weather/season"
                    );
                    setSelectedItem(null);
                  }}
                >
                  Wrong Season
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reasoning Modal */}
      <Dialog open={showReasoningModal} onOpenChange={setShowReasoningModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Why I Chose This Outfit</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">
            {outfit.reasoning}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
