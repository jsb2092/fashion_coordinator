"use client";

import { useState } from "react";
import { WardrobeItem } from "@prisma/client";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CATEGORIES,
  FORMALITY_LEVELS,
  SEASONS,
  ITEM_STATUSES,
  PATTERNS,
} from "@/constants/categories";
import { updateWardrobeItem, deleteWardrobeItem } from "@/lib/actions";
import { toast } from "sonner";

interface ItemDetailModalProps {
  item: WardrobeItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ItemDetailModal({
  item,
  isOpen,
  onClose,
}: ItemDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<WardrobeItem>>({});

  if (!item) return null;

  const currentData = { ...item, ...formData };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateWardrobeItem(item.id, formData as never);
      toast.success("Item updated successfully");
      setIsEditing(false);
      setFormData({});
      onClose();
    } catch {
      toast.error("Failed to update item");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      await deleteWardrobeItem(item.id);
      toast.success("Item deleted");
      onClose();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const updateField = (field: keyof WardrobeItem, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{currentData.category}</span>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({});
                    }}
                  >
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

        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                {isEditing ? (
                  <Select
                    value={currentData.category}
                    onValueChange={(v) => updateField("category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{currentData.category}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                {isEditing ? (
                  <Input
                    value={currentData.subcategory || ""}
                    onChange={(e) => updateField("subcategory", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{currentData.subcategory || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Primary Color</Label>
                {isEditing ? (
                  <Input
                    value={currentData.colorPrimary}
                    onChange={(e) => updateField("colorPrimary", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{currentData.colorPrimary}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Secondary Color</Label>
                {isEditing ? (
                  <Input
                    value={currentData.colorSecondary || ""}
                    onChange={(e) => updateField("colorSecondary", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{currentData.colorSecondary || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Pattern</Label>
                {isEditing ? (
                  <Select
                    value={currentData.pattern || "Solid"}
                    onValueChange={(v) => updateField("pattern", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PATTERNS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{currentData.pattern || "Solid"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                {isEditing ? (
                  <Input
                    value={currentData.brand || ""}
                    onChange={(e) => updateField("brand", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{currentData.brand || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Material</Label>
                {isEditing ? (
                  <Input
                    value={currentData.material || ""}
                    onChange={(e) => updateField("material", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{currentData.material || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Formality</Label>
                {isEditing ? (
                  <Select
                    value={currentData.formalityLevel.toString()}
                    onValueChange={(v) => updateField("formalityLevel", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMALITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">
                    {FORMALITY_LEVELS.find((l) => l.value === currentData.formalityLevel)
                      ?.label || "Unknown"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={currentData.status}
                    onValueChange={(v) => updateField("status", v)}
                  >
                    <SelectTrigger>
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
                ) : (
                  <Badge variant="secondary">{currentData.status}</Badge>
                )}
              </div>

              <div className="space-y-2">
                <Label>Seasons</Label>
                <div className="flex flex-wrap gap-1">
                  {currentData.seasonSuitability.map((season) => (
                    <Badge key={season} variant="outline">
                      {season.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              {isEditing ? (
                <Textarea
                  value={currentData.notes || ""}
                  onChange={(e) => updateField("notes", e.target.value)}
                  rows={3}
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {currentData.notes || "No notes"}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <p>Worn {currentData.timesWorn} times</p>
                {currentData.lastWorn && (
                  <p>Last worn: {new Date(currentData.lastWorn).toLocaleDateString()}</p>
                )}
              </div>
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete Item
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              {currentData.photoUrls.map((url, index) => (
                <div key={url} className="aspect-square relative rounded-lg overflow-hidden">
                  <img
                    src={url}
                    alt={`${currentData.category} photo ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>
            {currentData.photoUrls.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                No photos uploaded
              </p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
