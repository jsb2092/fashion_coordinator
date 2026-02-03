"use client";

import { useState } from "react";
import { Outfit, OutfitItem, WardrobeItem } from "@prisma/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { OCCASION_TYPES, FORMALITY_LEVELS } from "@/constants/categories";
import { deleteOutfit } from "@/lib/actions";
import { toast } from "sonner";

type OutfitWithItems = Outfit & {
  items: (OutfitItem & { wardrobeItem: WardrobeItem })[];
};

interface OutfitDetailModalProps {
  outfit: OutfitWithItems | null;
  isOpen: boolean;
  onClose: () => void;
}

export function OutfitDetailModal({
  outfit,
  isOpen,
  onClose,
}: OutfitDetailModalProps) {
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  if (!outfit) return null;

  const occasionLabel =
    OCCASION_TYPES.find((o) => o.value === outfit.occasionType)?.label ||
    outfit.occasionType;
  const formalityLabel =
    FORMALITY_LEVELS.find((f) => f.value === outfit.formalityScore)?.label ||
    "";

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this outfit?")) return;

    try {
      await deleteOutfit(outfit.id);
      toast.success("Outfit deleted");
      onClose();
    } catch {
      toast.error("Failed to delete outfit");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{outfit.name}</span>
            <div className="flex gap-2">
              {outfit.createdBy === "ai" && (
                <Badge variant="default">AI Generated</Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Outfit Info */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{occasionLabel}</Badge>
            {formalityLabel && <Badge variant="outline">{formalityLabel}</Badge>}
            <Badge variant="outline">{outfit.items.length} items</Badge>
            <Badge variant="outline">Worn {outfit.timesWorn} times</Badge>
          </div>

          {/* Items Grid */}
          <div>
            <Label className="mb-3 block">Items in this outfit</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {outfit.items.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    selectedItem?.id === item.wardrobeItem.id
                      ? "ring-2 ring-primary"
                      : ""
                  }`}
                  onClick={() => setSelectedItem(item.wardrobeItem)}
                >
                  <div className="aspect-square bg-muted relative">
                    {item.wardrobeItem.photoUrls[0] ? (
                      <img
                        src={item.wardrobeItem.photoUrls[0]}
                        alt={item.wardrobeItem.category}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground p-2 text-center">
                        <div>
                          <p className="font-medium text-sm">
                            {item.wardrobeItem.category}
                          </p>
                          <p className="text-xs">{item.wardrobeItem.colorPrimary}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">
                      {item.wardrobeItem.category}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.wardrobeItem.colorPrimary}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Selected Item Detail */}
          {selectedItem && (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex gap-4">
                {selectedItem.photoUrls[0] && (
                  <img
                    src={selectedItem.photoUrls[0]}
                    alt={selectedItem.category}
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                )}
                <div className="flex-1 space-y-2">
                  <h4 className="font-semibold">{selectedItem.category}</h4>
                  {selectedItem.subcategory && (
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.subcategory}
                    </p>
                  )}
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
                  {selectedItem.material && (
                    <p className="text-sm">Material: {selectedItem.material}</p>
                  )}
                  {selectedItem.notes && (
                    <p className="text-sm text-muted-foreground">
                      {selectedItem.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* AI Reasoning */}
          {outfit.aiReasoning && (
            <div>
              <Label className="mb-2 block">Styling Notes</Label>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {outfit.aiReasoning}
              </p>
            </div>
          )}

          {/* Description */}
          {outfit.description && (
            <div>
              <Label className="mb-2 block">Description</Label>
              <p className="text-sm">{outfit.description}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Delete Outfit
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
