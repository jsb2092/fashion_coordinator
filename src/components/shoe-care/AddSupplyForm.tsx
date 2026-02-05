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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

interface AnalysisResult {
  name: string;
  category: SupplyCategoryValue;
  subcategory: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  compatibleColors: string[];
  compatibleMaterials: string[];
  notes: string | null;
  estimatedPrice: number | null;
  reorderUrl: string | null;
}

interface KitAnalysisResult {
  isKit: boolean;
  kitName: string | null;
  items: AnalysisResult[];
}

export function AddSupplyForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"photo" | "url" | "manual">("photo");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [productUrl, setProductUrl] = useState("");
  const [kitDescription, setKitDescription] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [kitAnalysis, setKitAnalysis] = useState<KitAnalysisResult | null>(null);
  const [selectedKitItems, setSelectedKitItems] = useState<Set<number>>(new Set());
  const [addingKitItems, setAddingKitItems] = useState(false);

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

  // Merge analysis with form data
  const currentData = analysis
    ? {
        ...formData,
        name: formData.name || analysis.name,
        category: formData.category || analysis.category,
        subcategory: formData.subcategory || analysis.subcategory || "",
        brand: formData.brand || analysis.brand || "",
        color: formData.color || analysis.color || "",
        size: formData.size || analysis.size || "",
        compatibleColors: formData.compatibleColors.length > 0 ? formData.compatibleColors : analysis.compatibleColors,
        compatibleMaterials: formData.compatibleMaterials.length > 0 ? formData.compatibleMaterials : analysis.compatibleMaterials,
        reorderUrl: formData.reorderUrl || analysis.reorderUrl || "",
        purchasePrice: formData.purchasePrice ?? analysis.estimatedPrice ?? undefined,
        notes: formData.notes || analysis.notes || "",
      }
    : formData;

  const subcategories = currentData.category
    ? SUPPLY_SUBCATEGORIES[currentData.category as SupplyCategoryValue] || []
    : [];

  const updateField = <K extends keyof typeof formData>(
    field: K,
    value: (typeof formData)[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleCompatibleColor = (color: string) => {
    const current = currentData.compatibleColors;
    const updated = current.includes(color)
      ? current.filter((c) => c !== color)
      : [...current, color];
    updateField("compatibleColors", updated);
  };

  const toggleCompatibleMaterial = (material: string) => {
    const current = currentData.compatibleMaterials;
    const updated = current.includes(material)
      ? current.filter((m) => m !== material)
      : [...current, material];
    updateField("compatibleMaterials", updated);
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
      await uploadAndAnalyze(files);
    }
  }, []);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      await uploadAndAnalyze(files);
    }
  };

  const uploadAndAnalyze = async (files: File[]) => {
    setIsAnalyzing(true);
    try {
      // Upload files first
      const uploadedUrls: string[] = [];
      for (const file of files.slice(0, 5)) {
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
      setPhotoUrls(uploadedUrls);

      // If kit description provided, use kit analysis
      if (kitDescription.trim()) {
        const analyzeRes = await fetch("/api/supply/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageUrls: uploadedUrls,
            kitDescription: kitDescription.trim(),
          }),
        });

        if (!analyzeRes.ok) {
          throw new Error("Failed to analyze");
        }

        const data = await analyzeRes.json() as KitAnalysisResult;
        if (data.isKit && data.items.length > 1) {
          setKitAnalysis(data);
          setSelectedKitItems(new Set(data.items.map((_, i) => i)));
          toast.success(`Found ${data.items.length} items in kit`);
        } else if (data.items.length === 1) {
          setAnalysis(data.items[0]);
          toast.success("Product analyzed successfully");
        }
      } else {
        // Regular single-item analysis
        const analyzeRes = await fetch("/api/supply/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrls: uploadedUrls }),
        });

        if (!analyzeRes.ok) {
          throw new Error("Failed to analyze");
        }

        const analysisData = await analyzeRes.json();
        setAnalysis(analysisData);
        toast.success("Photo analyzed successfully");
      }
    } catch (error) {
      console.error("Upload/analyze error:", error);
      toast.error("Failed to analyze photo");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeFromUrl = async () => {
    if (!productUrl.trim()) {
      toast.error("Please enter a product URL");
      return;
    }

    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/supply/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productUrl: productUrl.trim(),
          kitDescription: kitDescription.trim() || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to analyze");
      }

      const data = await res.json() as KitAnalysisResult;

      if (data.isKit && data.items.length > 1) {
        // It's a kit with multiple items
        setKitAnalysis(data);
        // Select all items by default
        setSelectedKitItems(new Set(data.items.map((_, i) => i)));
        toast.success(`Found ${data.items.length} items in kit`);
      } else {
        // Single item
        setAnalysis(data.items[0]);
        updateField("reorderUrl", productUrl.trim());
        toast.success("Product info extracted");
      }
    } catch (error) {
      console.error("URL analyze error:", error);
      toast.error("Failed to extract product info from URL");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentData.name.trim()) {
      toast.error("Please enter a name");
      return;
    }

    if (!currentData.category) {
      toast.error("Please select a category");
      return;
    }

    setIsSubmitting(true);
    try {
      await createCareSupply({
        photoUrls,
        name: currentData.name.trim(),
        category: currentData.category,
        subcategory: currentData.subcategory || undefined,
        brand: currentData.brand || undefined,
        color: currentData.color || undefined,
        size: currentData.size || undefined,
        compatibleColors: currentData.compatibleColors,
        compatibleMaterials: currentData.compatibleMaterials,
        status: currentData.status,
        quantity: currentData.quantity,
        quantityUnit: currentData.quantityUnit,
        reorderThreshold: formData.reorderThreshold,
        purchaseSource: formData.purchaseSource || undefined,
        purchasePrice: currentData.purchasePrice,
        reorderUrl: currentData.reorderUrl || undefined,
        rating: formData.rating,
        notes: currentData.notes || undefined,
      });

      toast.success("Supply added successfully");
      router.push("/shoe-care");
    } catch {
      toast.error("Failed to add supply");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setAnalysis(null);
    setKitAnalysis(null);
    setSelectedKitItems(new Set());
    setPhotoUrls([]);
    setProductUrl("");
    setKitDescription("");
    setFormData({
      name: "",
      category: "",
      subcategory: "",
      brand: "",
      color: "",
      size: "",
      compatibleColors: [],
      compatibleMaterials: [],
      status: "IN_STOCK",
      quantity: 1,
      quantityUnit: "each",
      reorderThreshold: undefined,
      purchaseSource: "",
      purchasePrice: undefined,
      reorderUrl: "",
      rating: undefined,
      notes: "",
    });
  };

  // Handle adding all selected kit items
  const handleAddKitItems = async () => {
    if (!kitAnalysis || selectedKitItems.size === 0) return;

    setAddingKitItems(true);
    let successCount = 0;

    try {
      // First, create the parent kit
      const kitReorderUrl = productUrl.trim() || kitAnalysis.items[0]?.reorderUrl || undefined;
      const parentKit = await createCareSupply({
        photoUrls: photoUrls,
        name: kitAnalysis.kitName || "Shoe Care Kit",
        category: "KIT",
        subcategory: "Complete care kit",
        brand: kitAnalysis.items[0]?.brand || undefined,
        reorderUrl: kitReorderUrl,
        notes: `Contains: ${kitAnalysis.items.map(i => i.name).join(", ")}`,
      });

      // Then create individual items linked to the kit
      for (const index of selectedKitItems) {
        const item = kitAnalysis.items[index];
        await createCareSupply({
          photoUrls: [], // Individual items don't need the kit photo
          name: item.name,
          category: item.category,
          subcategory: item.subcategory || undefined,
          brand: item.brand || undefined,
          color: item.color || undefined,
          size: item.size || undefined,
          compatibleColors: item.compatibleColors,
          compatibleMaterials: item.compatibleMaterials,
          notes: item.notes || undefined,
          parentKitId: parentKit.id, // Link to parent kit
        });
        successCount++;
      }

      toast.success(`Added kit with ${successCount} items`);
      router.push("/shoe-care");
    } catch {
      toast.error(`Added ${successCount} items, but some failed`);
    } finally {
      setAddingKitItems(false);
    }
  };

  const toggleKitItem = (index: number) => {
    setSelectedKitItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  // Show kit items selection
  if (kitAnalysis) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Badge variant="secondary">Kit Detected</Badge>
              {kitAnalysis.kitName}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This kit contains {kitAnalysis.items.length} items. Select which ones to add to your inventory.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedKitItems(new Set(kitAnalysis.items.map((_, i) => i)))}
              >
                Select All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedKitItems(new Set())}
              >
                Deselect All
              </Button>
            </div>

            {kitAnalysis.items.map((item, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedKitItems.has(index)
                    ? "border-primary bg-primary/5"
                    : "hover:bg-muted/50"
                )}
                onClick={() => toggleKitItem(index)}
              >
                <div className="pt-0.5">
                  <div
                    className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center",
                      selectedKitItems.has(index)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selectedKitItems.has(index) && (
                      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{item.name}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {SUPPLY_CATEGORIES.find((c) => c.value === item.category)?.label || item.category}
                    </Badge>
                    {item.color && (
                      <Badge variant="secondary" className="text-xs">
                        {item.color}
                      </Badge>
                    )}
                    {item.brand && (
                      <Badge variant="secondary" className="text-xs">
                        {item.brand}
                      </Badge>
                    )}
                  </div>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
            Start Over
          </Button>
          <Button
            onClick={handleAddKitItems}
            disabled={addingKitItems || selectedKitItems.size === 0}
            className="flex-1"
          >
            {addingKitItems
              ? "Adding..."
              : `Add ${selectedKitItems.size} Item${selectedKitItems.size !== 1 ? "s" : ""}`}
          </Button>
        </div>
      </div>
    );
  }

  // Show analysis results form
  if (analysis || mode === "manual") {
    return (
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Photo Preview or Upload */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {photoUrls.length > 0 && (
              <div className="grid grid-cols-4 gap-3">
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
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
            {photoUrls.length < 5 && (
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length > 0) {
                      // Just upload without re-analyzing
                      for (const file of files.slice(0, 5 - photoUrls.length)) {
                        const uploadFormData = new FormData();
                        uploadFormData.append("file", file);
                        const res = await fetch("/api/upload", { method: "POST", body: uploadFormData });
                        if (res.ok) {
                          const { url } = await res.json();
                          setPhotoUrls(prev => [...prev, url]);
                        }
                      }
                      toast.success("Photo added");
                    }
                  }}
                  className="hidden"
                  id="add-more-photos"
                />
                <label
                  htmlFor="add-more-photos"
                  className="cursor-pointer text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  {photoUrls.length === 0 ? "Add photos" : "Add more photos"}
                </label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Reorder URL - Prominent placement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reorder Link</CardTitle>
            <p className="text-sm text-muted-foreground">
              Save a link to reorder this product when you run low
            </p>
          </CardHeader>
          <CardContent>
            <Input
              type="url"
              value={currentData.reorderUrl}
              onChange={(e) => updateField("reorderUrl", e.target.value)}
              placeholder="https://amazon.com/dp/..."
            />
          </CardContent>
        </Card>

        {/* AI Analysis Badge */}
        {analysis && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">AI Analyzed</Badge>
            <span>Review and adjust the detected attributes below</span>
          </div>
        )}

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
                  value={currentData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="e.g., Saphir Pate de Luxe"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={currentData.category}
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
                  value={currentData.subcategory}
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
                  value={currentData.brand}
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
                  value={currentData.color}
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
                  value={currentData.size}
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
            <CardTitle className="text-lg">Inventory & Purchase</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={currentData.status}
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
                    value={currentData.quantity}
                    onChange={(e) => updateField("quantity", parseInt(e.target.value) || 0)}
                    className="w-20"
                  />
                  <Select
                    value={currentData.quantityUnit}
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
                <Label htmlFor="purchasePrice">Purchase Price</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentData.purchasePrice || ""}
                  onChange={(e) => updateField("purchasePrice", parseFloat(e.target.value) || undefined)}
                  placeholder="0.00"
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
            <CardTitle className="text-lg">Compatibility</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Compatible Colors (for matching to shoes)</Label>
              <div className="flex flex-wrap gap-2">
                {POLISH_COLORS.map((color) => (
                  <Badge
                    key={color}
                    variant={currentData.compatibleColors.includes(color) ? "default" : "outline"}
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
                    variant={currentData.compatibleMaterials.includes(material) ? "default" : "outline"}
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
              value={currentData.notes}
              onChange={(e) => updateField("notes", e.target.value)}
              rows={3}
              placeholder="Any additional notes..."
            />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={resetForm} className="flex-1">
            Start Over
          </Button>
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting ? "Adding..." : "Add Supply"}
          </Button>
        </div>
      </form>
    );
  }

  // Initial mode selection
  return (
    <div className="space-y-6">
      {/* Kit Description - Always visible at top */}
      <Card>
        <CardHeader>
          <CardTitle>Adding a Kit?</CardTitle>
          <p className="text-sm text-muted-foreground">
            If this is a kit with multiple items, describe what&apos;s included and each item will be added separately
          </p>
        </CardHeader>
        <CardContent>
          <Textarea
            value={kitDescription}
            onChange={(e) => setKitDescription(e.target.value)}
            placeholder="e.g., 2 horsehair brushes (light and dark), black cream polish, burgundy cream polish, neutral wax, 2 microfiber cloths, shoe horn"
            rows={3}
            disabled={isAnalyzing}
          />
        </CardContent>
      </Card>

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Product Photo</CardTitle>
          <p className="text-sm text-muted-foreground">
            {kitDescription ? "Photo will be attached to all items in the kit" : "Take a photo and AI will identify the product"}
          </p>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-12 text-center transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50",
              isAnalyzing && "opacity-50 pointer-events-none"
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
              id="photo-upload"
              disabled={isAnalyzing}
            />
            <label htmlFor="photo-upload" className="cursor-pointer flex flex-col items-center">
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-12 w-12 text-primary mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <p className="text-sm font-medium">Analyzing with AI...</p>
                </>
              ) : (
                <>
                  <svg className="h-12 w-12 text-muted-foreground mb-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  <p className="text-sm font-medium">Drag and drop a photo, or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {kitDescription ? "Upload kit photo" : "AI will identify the product automatically"}
                  </p>
                </>
              )}
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* URL Input */}
      <Card>
        <CardHeader>
          <CardTitle>Product URL</CardTitle>
          <p className="text-sm text-muted-foreground">
            Paste an Amazon or retailer link to extract product info
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="url"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://amazon.com/dp/..."
              className="flex-1"
              disabled={isAnalyzing}
            />
            <Button onClick={analyzeFromUrl} disabled={isAnalyzing || !productUrl.trim()}>
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Analyzing...
                </>
              ) : (
                "Extract Info"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or</span>
        </div>
      </div>

      {/* Manual Entry */}
      <Card>
        <CardContent className="pt-6">
          <Button variant="outline" onClick={() => setMode("manual")} className="w-full">
            Enter Details Manually
          </Button>
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button variant="ghost" onClick={() => router.push("/shoe-care")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
