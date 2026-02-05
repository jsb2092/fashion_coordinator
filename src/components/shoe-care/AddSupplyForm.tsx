"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  SUPPLY_CATEGORIES,
  SUPPLY_SUBCATEGORIES,
  SUPPLY_STATUSES,
  POLISH_COLORS,
  COMPATIBLE_MATERIALS,
  COMMON_BRANDS,
  QUANTITY_UNITS,
  SupplyCategoryValue,
} from "@/constants/careSupplies";
import { createCareSupply } from "@/lib/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function AddSupplyForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    category: "" as SupplyCategoryValue | "",
    subcategory: "",
    brand: "",
    color: "",
    size: "",
    compatibleColors: [] as string[],
    compatibleMaterials: [] as string[],
    status: "IN_STOCK",
    quantity: 1,
    quantityUnit: "each",
    reorderThreshold: undefined as number | undefined,
    purchaseSource: "",
    purchasePrice: undefined as number | undefined,
    reorderUrl: "",
    rating: undefined as number | undefined,
    notes: "",
  });

  const subcategories = formData.category
    ? SUPPLY_SUBCATEGORIES[formData.category] || []
    : [];

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCompatibleColor = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      compatibleColors: prev.compatibleColors.includes(color)
        ? prev.compatibleColors.filter((c) => c !== color)
        : [...prev.compatibleColors, color],
    }));
  };

  const toggleCompatibleMaterial = (material: string) => {
    setFormData((prev) => ({
      ...prev,
      compatibleMaterials: prev.compatibleMaterials.includes(material)
        ? prev.compatibleMaterials.filter((m) => m !== material)
        : [...prev.compatibleMaterials, material],
    }));
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      const uploadedUrls: string[] = [];
      for (const file of files.slice(0, 5 - photoUrls.length)) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!res.ok) {
          throw new Error("Failed to upload");
        }

        const { url } = await res.json();
        uploadedUrls.push(url);
      }
      setPhotoUrls((prev) => [...prev, ...uploadedUrls]);
      toast.success(`Uploaded ${uploadedUrls.length} photo${uploadedUrls.length !== 1 ? "s" : ""}`);
    } catch {
      toast.error("Failed to upload photos");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (!formData.category) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCareSupply({
        photoUrls,
        name: formData.name.trim(),
        category: formData.category,
        subcategory: formData.subcategory || undefined,
        brand: formData.brand || undefined,
        color: formData.color || undefined,
        size: formData.size || undefined,
        compatibleColors: formData.compatibleColors,
        compatibleMaterials: formData.compatibleMaterials,
        status: formData.status,
        quantity: formData.quantity,
        quantityUnit: formData.quantityUnit,
        reorderThreshold: formData.reorderThreshold,
        purchaseSource: formData.purchaseSource || undefined,
        purchasePrice: formData.purchasePrice,
        reorderUrl: formData.reorderUrl || undefined,
        rating: formData.rating,
        notes: formData.notes || undefined,
      });

      toast.success("Supply added successfully");
      router.push("/shoe-care");
    } catch {
      toast.error("Failed to add supply");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Photos</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              photoUrls.length >= 5 && "opacity-50 pointer-events-none"
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
              disabled={photoUrls.length >= 5 || isUploading}
            />
            <label
              htmlFor="photo-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <svg
                className="h-12 w-12 text-muted-foreground mb-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm font-medium">
                {isUploading ? "Uploading..." : "Drag and drop photos here, or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upload up to 5 photos (JPG, PNG, WEBP)
              </p>
            </label>
          </div>

          {photoUrls.length > 0 && (
            <div className="grid grid-cols-4 gap-3 mt-4">
              {photoUrls.map((url, index) => (
                <div key={url} className="relative aspect-square group">
                  <img
                    src={url}
                    alt={`Photo ${index + 1}`}
                    className="h-full w-full object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 p-1 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
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
        </CardContent>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Saphir Pate de Luxe"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(v) => {
                  updateField("category", v as SupplyCategoryValue);
                  updateField("subcategory", "");
                }}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPLY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={formData.subcategory}
                onValueChange={(v) => updateField("subcategory", v)}
                disabled={subcategories.length === 0}
              >
                <SelectTrigger id="subcategory">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="brand">Brand</Label>
              <Select
                value={formData.brand}
                onValueChange={(v) => updateField("brand", v)}
              >
                <SelectTrigger id="brand">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Select
                value={formData.color}
                onValueChange={(v) => updateField("color", v)}
              >
                <SelectTrigger id="color">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                value={formData.size}
                onChange={(e) => updateField("size", e.target.value)}
                placeholder="e.g., 75ml, Large"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Inventory */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => updateField("status", v)}
              >
                <SelectTrigger id="status">
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
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => updateField("quantity", parseInt(e.target.value) || 0)}
                  className="w-20"
                />
                <Select
                  value={formData.quantityUnit}
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="reorderThreshold">Reorder Threshold</Label>
              <Input
                id="reorderThreshold"
                type="number"
                min="0"
                value={formData.reorderThreshold || ""}
                onChange={(e) =>
                  updateField("reorderThreshold", parseInt(e.target.value) || undefined)
                }
                placeholder="Alert when below this"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchaseSource">Purchase Source</Label>
              <Input
                id="purchaseSource"
                value={formData.purchaseSource}
                onChange={(e) => updateField("purchaseSource", e.target.value)}
                placeholder="Where to buy / reorder URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="purchasePrice">Purchase Price</Label>
              <Input
                id="purchasePrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.purchasePrice || ""}
                onChange={(e) =>
                  updateField("purchasePrice", parseFloat(e.target.value) || undefined)
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="reorderUrl">Reorder URL</Label>
              <Input
                id="reorderUrl"
                type="url"
                value={formData.reorderUrl}
                onChange={(e) => updateField("reorderUrl", e.target.value)}
                placeholder="https://example.com/product"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rating">Rating</Label>
              <Select
                value={formData.rating?.toString() || ""}
                onValueChange={(v) => updateField("rating", v ? parseInt(v) : undefined)}
              >
                <SelectTrigger id="rating">
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compatibility */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Compatibility (for matching to shoes)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Compatible Colors</Label>
            <div className="flex flex-wrap gap-2">
              {POLISH_COLORS.map((color) => (
                <Badge
                  key={color}
                  variant={formData.compatibleColors.includes(color) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCompatibleColor(color)}
                >
                  {color}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Compatible Materials</Label>
            <div className="flex flex-wrap gap-2">
              {COMPATIBLE_MATERIALS.map((material) => (
                <Badge
                  key={material}
                  variant={formData.compatibleMaterials.includes(material) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleCompatibleMaterial(material)}
                >
                  {material}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            rows={3}
            placeholder="Any additional notes about this supply..."
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/shoe-care")}
          className="flex-1"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting ? "Adding..." : "Add Supply"}
        </Button>
      </div>
    </form>
  );
}
