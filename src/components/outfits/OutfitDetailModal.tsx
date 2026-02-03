"use client";

import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { OCCASION_TYPES, FORMALITY_LEVELS } from "@/constants/categories";
import { deleteOutfit, updateOutfit, getWardrobeItems } from "@/lib/actions";
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
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedItems, setEditedItems] = useState<WardrobeItem[]>([]);
  const [editedName, setEditedName] = useState("");
  const [editedOccasion, setEditedOccasion] = useState("");
  const [allWardrobeItems, setAllWardrobeItems] = useState<WardrobeItem[]>([]);
  const [showItemPicker, setShowItemPicker] = useState(false);

  useEffect(() => {
    if (outfit) {
      setEditedItems(outfit.items.map((i) => i.wardrobeItem));
      setEditedName(outfit.name);
      setEditedOccasion(outfit.occasionType);
    }
  }, [outfit?.id]);

  useEffect(() => {
    if (isEditing && allWardrobeItems.length === 0) {
      getWardrobeItems({ status: "ACTIVE" }).then(setAllWardrobeItems);
    }
  }, [isEditing]);

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

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateOutfit(outfit.id, {
        name: editedName,
        occasionType: editedOccasion,
        itemIds: editedItems.map((i) => i.id),
      });
      toast.success("Outfit updated");
      setIsEditing(false);
      onClose();
    } catch {
      toast.error("Failed to update outfit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    setEditedItems((items) => items.filter((i) => i.id !== itemId));
  };

  const handleAddItem = (item: WardrobeItem) => {
    if (!editedItems.find((i) => i.id === item.id)) {
      setEditedItems((items) => [...items, item]);
    }
    setShowItemPicker(false);
  };

  const handleCancelEdit = () => {
    setEditedItems(outfit.items.map((i) => i.wardrobeItem));
    setEditedName(outfit.name);
    setEditedOccasion(outfit.occasionType);
    setIsEditing(false);
    setShowItemPicker(false);
  };

  const displayItems = isEditing ? editedItems : outfit.items.map((i) => i.wardrobeItem);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            {isEditing ? (
              <Input
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                className="text-lg font-semibold"
              />
            ) : (
              <span>{outfit.name}</span>
            )}
            <div className="flex gap-2">
              {outfit.createdBy === "ai" && (
                <Badge variant="default">AI Generated</Badge>
              )}
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave} disabled={isSaving}>
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Outfit Info */}
          <div className="flex flex-wrap gap-2 items-center">
            {isEditing ? (
              <Select value={editedOccasion} onValueChange={setEditedOccasion}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OCCASION_TYPES.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="secondary">{occasionLabel}</Badge>
            )}
            {formalityLabel && <Badge variant="outline">{formalityLabel}</Badge>}
            <Badge variant="outline">{displayItems.length} items</Badge>
            <Badge variant="outline">Worn {outfit.timesWorn} times</Badge>
          </div>

          {/* Items Grid */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label>Items in this outfit</Label>
              {isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowItemPicker(true)}
                >
                  + Add Item
                </Button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayItems.map((item) => (
                <Card
                  key={item.id}
                  className={`overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-primary ${
                    selectedItem?.id === item.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => !isEditing && setSelectedItem(item)}
                >
                  <div className="aspect-square bg-muted relative">
                    {item.photoUrls[0] ? (
                      <img
                        src={item.photoUrls[0]}
                        alt={item.category}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground p-2 text-center">
                        <div>
                          <p className="font-medium text-sm">{item.category}</p>
                          <p className="text-xs">{item.colorPrimary}</p>
                        </div>
                      </div>
                    )}
                    {isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveItem(item.id);
                        }}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white hover:bg-red-600"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium truncate">{item.category}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.colorPrimary}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Item Picker */}
          {showItemPicker && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-base font-semibold">Select an item to add</Label>
                <Button variant="outline" size="sm" onClick={() => setShowItemPicker(false)}>
                  Close
                </Button>
              </div>
              <ScrollArea className="h-80">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pr-4">
                  {allWardrobeItems
                    .filter((i) => !editedItems.find((e) => e.id === i.id))
                    .map((item) => (
                      <Card
                        key={item.id}
                        className="overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                        onClick={() => handleAddItem(item)}
                      >
                        <div className="aspect-square bg-muted relative">
                          {item.photoUrls[0] ? (
                            <img
                              src={item.photoUrls[0]}
                              alt={item.category}
                              className="absolute inset-0 h-full w-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground p-2 text-center">
                              <div>
                                <p className="text-sm font-medium">{item.category}</p>
                                <p className="text-xs">{item.colorPrimary}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="p-2">
                          <p className="text-xs font-medium truncate">{item.category}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.colorPrimary}
                            {item.brand && ` · ${item.brand}`}
                          </p>
                        </div>
                      </Card>
                    ))}
                </div>
              </ScrollArea>
            </div>
          )}

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
