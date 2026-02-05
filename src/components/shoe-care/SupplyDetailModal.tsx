"use client";

import { useState, useEffect } from "react";
import { CareSupply, ShoeSupplyLink, WardrobeItem } from "@prisma/client";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  SUPPLY_CATEGORIES,
  SUPPLY_SUBCATEGORIES,
  SUPPLY_STATUSES,
  POLISH_COLORS,
  COMPATIBLE_MATERIALS,
  COMMON_BRANDS,
  QUANTITY_UNITS,
} from "@/constants/careSupplies";
import {
  updateCareSupply,
  deleteCareSupply,
  linkSupplyToShoe,
  unlinkSupplyFromShoe,
} from "@/lib/actions";
import { toast } from "sonner";
import { PhotoUploader } from "@/components/wardrobe/PhotoUploader";

type CareSupplyWithLinks = CareSupply & {
  shoeLinks: (ShoeSupplyLink & { wardrobeItem: WardrobeItem })[];
};

interface SupplyDetailModalProps {
  supply: CareSupplyWithLinks | null;
  shoes: WardrobeItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function SupplyDetailModal({
  supply,
  shoes,
  isOpen,
  onClose,
}: SupplyDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [formData, setFormData] = useState<Partial<CareSupply>>({});
  const [photoUrls, setPhotoUrls] = useState<string[] | null>(null);
  const [linkedShoeIds, setLinkedShoeIds] = useState<Set<string>>(new Set());

  // Reset state when supply changes
  useEffect(() => {
    setIsEditing(false);
    setFormData({});
    setPhotoUrls(null);
    if (supply) {
      setLinkedShoeIds(new Set(supply.shoeLinks.map((l) => l.wardrobeItemId)));
    }
  }, [supply?.id]);

  if (!supply) return null;

  // Use local photoUrls if we've modified them, otherwise use supply's photos
  const currentPhotoUrls = photoUrls !== null ? photoUrls : supply.photoUrls;

  const currentData = { ...supply, ...formData };
  const currentCategory = (formData.category || supply.category) as keyof typeof SUPPLY_SUBCATEGORIES;
  const subcategories = SUPPLY_SUBCATEGORIES[currentCategory] || [];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateCareSupply(supply.id, formData as never);
      toast.success("Supply updated successfully");
      setIsEditing(false);
      setFormData({});
      onClose();
    } catch {
      toast.error("Failed to update supply");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this supply?")) return;

    try {
      await deleteCareSupply(supply.id);
      toast.success("Supply deleted");
      onClose();
    } catch {
      toast.error("Failed to delete supply");
    }
  };

  const updateField = (field: keyof CareSupply, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to upload");
        }

        const { url } = await res.json();
        uploadedUrls.push(url);
      }

      const newPhotoUrls = [...currentPhotoUrls, ...uploadedUrls];
      await updateCareSupply(supply.id, { photoUrls: newPhotoUrls });
      setPhotoUrls(newPhotoUrls);
      toast.success(`Uploaded ${files.length} photo${files.length !== 1 ? "s" : ""}`);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemovePhoto = async (index: number) => {
    const newPhotoUrls = currentPhotoUrls.filter((_, i) => i !== index);
    try {
      await updateCareSupply(supply.id, { photoUrls: newPhotoUrls });
      setPhotoUrls(newPhotoUrls);
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    }
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    setIsChangingStatus(true);
    try {
      await updateCareSupply(supply.id, { status: newStatus });
      toast.success(`Status changed to ${SUPPLY_STATUSES.find((s) => s.value === newStatus)?.label || newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleShoeLink = async (shoeId: string, linked: boolean) => {
    try {
      if (linked) {
        await linkSupplyToShoe(supply.id, shoeId);
        setLinkedShoeIds((prev) => new Set([...prev, shoeId]));
        toast.success("Shoe linked");
      } else {
        await unlinkSupplyFromShoe(supply.id, shoeId);
        setLinkedShoeIds((prev) => {
          const newSet = new Set(prev);
          newSet.delete(shoeId);
          return newSet;
        });
        toast.success("Shoe unlinked");
      }
    } catch {
      toast.error("Failed to update shoe link");
    }
  };

  const toggleCompatibleColor = (color: string) => {
    const current = currentData.compatibleColors || [];
    const newColors = current.includes(color)
      ? current.filter((c) => c !== color)
      : [...current, color];
    updateField("compatibleColors", newColors);
  };

  const toggleCompatibleMaterial = (material: string) => {
    const current = currentData.compatibleMaterials || [];
    const newMaterials = current.includes(material)
      ? current.filter((m) => m !== material)
      : [...current, material];
    updateField("compatibleMaterials", newMaterials);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{currentData.name}</span>
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

        {/* Quick Status Change - Always visible */}
        <div className="flex items-center gap-3 py-2 px-1 border-b">
          <Label className="text-sm text-muted-foreground shrink-0">Status:</Label>
          <Select
            value={currentData.status}
            onValueChange={handleQuickStatusChange}
            disabled={isChangingStatus}
          >
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPLY_STATUSES.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isChangingStatus && <span className="text-xs text-muted-foreground">Saving...</span>}
        </div>

        <Tabs defaultValue="details" className="mt-4">
          <TabsList>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="shoes">Linked Shoes</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name</Label>
                {isEditing ? (
                  <Input
                    value={currentData.name}
                    onChange={(e) => updateField("name", e.target.value)}
                  />
                ) : (
                  <p className="text-sm">{currentData.name}</p>
                )}
              </div>

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
                      {SUPPLY_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">
                    {SUPPLY_CATEGORIES.find((c) => c.value === currentData.category)?.label}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Subcategory</Label>
                {isEditing ? (
                  <Select
                    value={currentData.subcategory || ""}
                    onValueChange={(v) => updateField("subcategory", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subcategory" />
                    </SelectTrigger>
                    <SelectContent>
                      {subcategories.map((sub) => (
                        <SelectItem key={sub} value={sub}>
                          {sub}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{currentData.subcategory || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Brand</Label>
                {isEditing ? (
                  <Select
                    value={currentData.brand || ""}
                    onValueChange={(v) => updateField("brand", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_BRANDS.map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {brand}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{currentData.brand || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Color</Label>
                {isEditing ? (
                  <Select
                    value={currentData.color || ""}
                    onValueChange={(v) => updateField("color", v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color" />
                    </SelectTrigger>
                    <SelectContent>
                      {POLISH_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          {color}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">{currentData.color || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Size</Label>
                {isEditing ? (
                  <Input
                    value={currentData.size || ""}
                    onChange={(e) => updateField("size", e.target.value)}
                    placeholder="e.g., 75ml, Large"
                  />
                ) : (
                  <p className="text-sm">{currentData.size || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Quantity</Label>
                {isEditing ? (
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min="0"
                      value={currentData.quantity}
                      onChange={(e) => updateField("quantity", parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Select
                      value={currentData.quantityUnit || "each"}
                      onValueChange={(v) => updateField("quantityUnit", v)}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {QUANTITY_UNITS.map((unit) => (
                          <SelectItem key={unit} value={unit}>
                            {unit}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <p className="text-sm">
                    {currentData.quantity}
                    {currentData.quantityUnit && ` ${currentData.quantityUnit}`}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Reorder Threshold</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    min="0"
                    value={currentData.reorderThreshold || ""}
                    onChange={(e) => updateField("reorderThreshold", parseInt(e.target.value) || null)}
                    placeholder="Alert when below this"
                  />
                ) : (
                  <p className="text-sm">{currentData.reorderThreshold || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Purchase Source</Label>
                {isEditing ? (
                  <Input
                    value={currentData.purchaseSource || ""}
                    onChange={(e) => updateField("purchaseSource", e.target.value)}
                    placeholder="Where to buy"
                  />
                ) : (
                  <p className="text-sm">{currentData.purchaseSource || "—"}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Purchase Price</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={currentData.purchasePrice?.toString() || ""}
                    onChange={(e) => updateField("purchasePrice", parseFloat(e.target.value) || null)}
                    placeholder="0.00"
                  />
                ) : (
                  <p className="text-sm">
                    {currentData.purchasePrice ? `$${currentData.purchasePrice}` : "—"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Rating</Label>
                {isEditing ? (
                  <Select
                    value={currentData.rating?.toString() || ""}
                    onValueChange={(v) => updateField("rating", v ? parseInt(v) : null)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Rate this product" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 - Excellent</SelectItem>
                      <SelectItem value="4">4 - Good</SelectItem>
                      <SelectItem value="3">3 - Average</SelectItem>
                      <SelectItem value="2">2 - Poor</SelectItem>
                      <SelectItem value="1">1 - Would not recommend</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm">
                    {currentData.rating
                      ? `${"★".repeat(currentData.rating)}${"☆".repeat(5 - currentData.rating)}`
                      : "—"}
                  </p>
                )}
              </div>

              <div className="space-y-2 col-span-2">
                <Label>Reorder URL</Label>
                {isEditing ? (
                  <Input
                    type="url"
                    value={currentData.reorderUrl || ""}
                    onChange={(e) => updateField("reorderUrl", e.target.value)}
                    placeholder="https://example.com/product"
                  />
                ) : currentData.reorderUrl ? (
                  <a
                    href={currentData.reorderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline flex items-center gap-1"
                  >
                    Reorder link
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                    </svg>
                  </a>
                ) : (
                  <p className="text-sm">—</p>
                )}
              </div>
            </div>

            {/* Compatible Colors */}
            <div className="space-y-2">
              <Label>Compatible Colors (for matching to shoes)</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {POLISH_COLORS.map((color) => (
                    <Badge
                      key={color}
                      variant={(currentData.compatibleColors || []).includes(color) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCompatibleColor(color)}
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(currentData.compatibleColors || []).length > 0 ? (
                    currentData.compatibleColors.map((color) => (
                      <Badge key={color} variant="secondary">
                        {color}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None specified</p>
                  )}
                </div>
              )}
            </div>

            {/* Compatible Materials */}
            <div className="space-y-2">
              <Label>Compatible Materials</Label>
              {isEditing ? (
                <div className="flex flex-wrap gap-2">
                  {COMPATIBLE_MATERIALS.map((material) => (
                    <Badge
                      key={material}
                      variant={(currentData.compatibleMaterials || []).includes(material) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleCompatibleMaterial(material)}
                    >
                      {material}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {(currentData.compatibleMaterials || []).length > 0 ? (
                    currentData.compatibleMaterials.map((material) => (
                      <Badge key={material} variant="secondary">
                        {material}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">None specified</p>
                  )}
                </div>
              )}
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

            <div className="flex justify-between items-center pt-4 border-t">
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                Delete Supply
              </Button>
              <div className="text-sm text-muted-foreground text-right">
                <p>Used {currentData.timesUsed} times</p>
                {currentData.lastUsed && (
                  <p>Last used: {new Date(currentData.lastUsed).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="photos" className="mt-4 space-y-4">
            {currentPhotoUrls.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {currentPhotoUrls.map((url, index) => (
                  <div key={url} className="aspect-square relative rounded-lg overflow-hidden group">
                    <img
                      src={url}
                      alt={`${currentData.name} photo ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                    <button
                      onClick={() => handleRemovePhoto(index)}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      type="button"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            <PhotoUploader
              key={supply.id}
              onUpload={handlePhotoUpload}
              isUploading={isUploading}
              maxFiles={5 - currentPhotoUrls.length}
            />
            {currentPhotoUrls.length >= 5 && (
              <p className="text-center text-muted-foreground text-sm">
                Maximum 5 photos per supply
              </p>
            )}
          </TabsContent>

          <TabsContent value="shoes" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Link this supply to specific shoes in your wardrobe for easy reference.
            </p>
            {shoes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No shoes in your wardrobe yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {shoes.map((shoe) => (
                  <div
                    key={shoe.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                  >
                    <Checkbox
                      id={`shoe-${shoe.id}`}
                      checked={linkedShoeIds.has(shoe.id)}
                      onCheckedChange={(checked) => handleShoeLink(shoe.id, !!checked)}
                    />
                    {shoe.photoUrls[0] ? (
                      <img
                        src={shoe.photoUrls[0]}
                        alt={shoe.category}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                        No photo
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{shoe.category}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {shoe.colorPrimary}
                        {shoe.brand && ` · ${shoe.brand}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
