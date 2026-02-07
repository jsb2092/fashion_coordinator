"use client";

import { useState, useEffect, useRef } from "react";
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

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const COMPRESSION_THRESHOLD = 10 * 1024 * 1024; // 10MB

async function compressImage(file: File, maxSizeMB: number = 10): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      const maxDim = 2000;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (height / width) * maxDim;
          width = maxDim;
        } else {
          width = (width / height) * maxDim;
          height = maxDim;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Could not compress image"));
              return;
            }

            if (blob.size > maxSizeMB * 1024 * 1024 && quality > 0.3) {
              quality -= 0.1;
              tryCompress();
            } else {
              const compressedFile = new File([blob], file.name, {
                type: "image/jpeg",
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          "image/jpeg",
          quality
        );
      };
      tryCompress();
    };
    img.onerror = () => reject(new Error("Could not load image"));
    img.src = URL.createObjectURL(file);
  });
}

interface FitCheck {
  overallScore: number;
  overallVerdict: string;
  colorHarmony: { score: number; feedback: string };
  formalityBalance: { score: number; feedback: string };
  fit: { score: number; feedback: string };
  proportions: { score: number; feedback: string };
  suggestions: string[];
  compliments: string[];
}

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

  // Photo verification state
  const [verifyPhoto, setVerifyPhoto] = useState<File | null>(null);
  const [verifyPreview, setVerifyPreview] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [fitCheckResult, setFitCheckResult] = useState<FitCheck | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (outfit) {
      setEditedItems(outfit.items.map((i) => i.wardrobeItem));
      setEditedName(outfit.name);
      setEditedOccasion(outfit.occasionType);
    }
  }, [outfit?.id]);

  // Reset verification state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setVerifyPhoto(null);
      if (verifyPreview) URL.revokeObjectURL(verifyPreview);
      setVerifyPreview(null);
      setFitCheckResult(null);
      setIsVerifying(false);
    }
  }, [isOpen]);

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

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    let processedFile = file;

    // Compress if needed
    if (file.size > COMPRESSION_THRESHOLD) {
      toast.info("Compressing image...");
      try {
        processedFile = await compressImage(file);
      } catch (error) {
        console.error("Compression failed:", error);
        toast.error("Failed to process image");
        return;
      }
    }

    // Check if still too large
    if (processedFile.size > MAX_FILE_SIZE) {
      toast.error("Image is too large. Please use a smaller image.");
      return;
    }

    if (verifyPreview) URL.revokeObjectURL(verifyPreview);
    setVerifyPhoto(processedFile);
    setVerifyPreview(URL.createObjectURL(processedFile));
    setFitCheckResult(null);
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await processFile(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const handleVerifyOutfit = async () => {
    if (!verifyPhoto || !outfit) return;

    setIsVerifying(true);
    try {
      // Upload the photo
      const formData = new FormData();
      formData.append("file", verifyPhoto);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload photo");
      }

      const { url } = await uploadRes.json();

      // Get fit check from AI
      const outfitDescription = displayItems
        .map((item) => `${item.colorPrimary} ${item.category}${item.brand ? ` (${item.brand})` : ""}`)
        .join(", ");

      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: `I'm trying this outfit: ${outfit.name}. It's supposed to include: ${outfitDescription}. Please give me a fit check and let me know how it looks!`,
            },
          ],
          imageUrls: [url],
        }),
      });

      const data = await chatRes.json();

      if (!chatRes.ok) {
        if (data.error === "subscription_required") {
          toast.error("Upgrade to Pro to use AI fit check");
          return;
        }
        throw new Error(data.message || "Failed to analyze outfit");
      }

      if (data.fitCheck) {
        setFitCheckResult(data.fitCheck);
        toast.success("Fit check complete!");
      } else {
        toast.info(data.content || "Could not analyze the photo");
      }
    } catch (error) {
      console.error("Verify outfit error:", error);
      toast.error("Failed to verify outfit");
    } finally {
      setIsVerifying(false);
    }
  };

  const clearVerification = () => {
    if (verifyPreview) URL.revokeObjectURL(verifyPreview);
    setVerifyPhoto(null);
    setVerifyPreview(null);
    setFitCheckResult(null);
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

          {/* Photo Verification */}
          {!isEditing && (
            <div className="border rounded-lg p-4 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                  Verify with Photo
                </Label>
                {verifyPreview && (
                  <Button variant="ghost" size="sm" onClick={clearVerification}>
                    Clear
                  </Button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              {!verifyPreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragging
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50"
                  }`}
                >
                  <p className="text-sm text-muted-foreground">
                    {isDragging
                      ? "Drop your photo here!"
                      : "Drag & drop a photo, or click to select"}
                  </p>
                  <Button variant="outline" size="sm" className="mt-3">
                    Choose Photo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <img
                      src={verifyPreview}
                      alt="Verification photo"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <div className="flex-1 flex flex-col justify-center">
                      <Button
                        onClick={handleVerifyOutfit}
                        disabled={isVerifying}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isVerifying ? (
                          <>
                            <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Analyzing...
                          </>
                        ) : (
                          "Get Fit Check"
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose Different Photo
                      </Button>
                    </div>
                  </div>

                  {/* Fit Check Results */}
                  {fitCheckResult && (
                    <div className="bg-background rounded-lg p-4 border border-purple-200/50">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Fit Check Results
                        </h4>
                        <span className="text-2xl font-bold text-purple-600">
                          {fitCheckResult.overallScore}/10
                        </span>
                      </div>
                      <p className="text-sm font-medium mb-3">{fitCheckResult.overallVerdict}</p>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {[
                          { label: "Colors", data: fitCheckResult.colorHarmony },
                          { label: "Formality", data: fitCheckResult.formalityBalance },
                          { label: "Fit", data: fitCheckResult.fit },
                          { label: "Proportions", data: fitCheckResult.proportions },
                        ].map((item) => (
                          <div key={item.label} className="bg-muted/50 rounded-md p-2">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium">{item.label}</span>
                              <span className="text-xs font-semibold">{item.data.score}/10</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{item.data.feedback}</p>
                          </div>
                        ))}
                      </div>

                      {fitCheckResult.compliments.length > 0 && (
                        <div className="mb-3">
                          <p className="text-xs font-medium text-green-600 mb-1">What&apos;s working:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {fitCheckResult.compliments.map((c, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-green-500">✓</span> {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {fitCheckResult.suggestions.length > 0 && (
                        <div>
                          <p className="text-xs font-medium text-amber-600 mb-1">Suggestions:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {fitCheckResult.suggestions.map((s, i) => (
                              <li key={i} className="flex items-start gap-1">
                                <span className="text-amber-500">→</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
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
