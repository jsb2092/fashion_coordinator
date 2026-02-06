"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WardrobeItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { CATEGORIES, OCCASION_TYPES } from "@/constants/categories";
import { createOutfit } from "@/lib/actions";
import { toast } from "sonner";

export default function NewOutfitPage() {
  const router = useRouter();
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<WardrobeItem[]>([]);
  const [name, setName] = useState("");
  const [occasionType, setOccasionType] = useState("CASUAL");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchItems() {
      try {
        const response = await fetch("/api/wardrobe");
        const data = await response.json();
        setItems(data);
      } catch (error) {
        console.error("Failed to fetch wardrobe items:", error);
        toast.error("Failed to load wardrobe items");
      } finally {
        setIsLoading(false);
      }
    }
    fetchItems();
  }, []);

  const filteredItems =
    categoryFilter === "all"
      ? items
      : items.filter((item) => item.category === categoryFilter);

  const toggleItem = (item: WardrobeItem) => {
    setSelectedItems((prev) =>
      prev.some((i) => i.id === item.id)
        ? prev.filter((i) => i.id !== item.id)
        : [...prev, item]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter an outfit name");
      return;
    }
    if (selectedItems.length === 0) {
      toast.error("Please select at least one item");
      return;
    }

    setIsSaving(true);
    try {
      const avgFormality = Math.round(
        selectedItems.reduce((sum, item) => sum + item.formalityLevel, 0) /
          selectedItems.length
      );

      await createOutfit({
        name,
        occasionType,
        itemIds: selectedItems.map((item) => item.id),
        formalityScore: avgFormality,
        createdBy: "manual",
      });

      toast.success("Outfit created successfully");
      router.push("/outfits");
    } catch (error) {
      console.error("Failed to create outfit:", error);
      toast.error("Failed to create outfit");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <svg
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back
        </Button>
      </div>

      <h1 className="text-2xl font-bold mb-6">Create New Outfit</h1>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Select Items</CardTitle>
              <div className="flex gap-2">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading wardrobe items...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No items found. Add items to your wardrobe first.
                </div>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {filteredItems.map((item) => {
                      const isSelected = selectedItems.some(
                        (i) => i.id === item.id
                      );
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleItem(item)}
                          className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all bg-muted ${
                            isSelected
                              ? "border-primary ring-2 ring-primary/20"
                              : "border-transparent hover:border-muted-foreground/20"
                          }`}
                        >
                          {item.photoUrls[0] ? (
                            <img
                              src={item.photoUrls[0]}
                              alt={item.category}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="h-full w-full bg-muted flex items-center justify-center text-xs text-muted-foreground p-2 text-center">
                              {item.category}
                            </div>
                          )}
                          {/* Item details overlay on hover */}
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white text-xs font-medium truncate">
                              {item.name || item.category}
                            </p>
                            <p className="text-white/70 text-xs truncate">
                              {item.colorPrimary}{item.brand ? ` • ${item.brand}` : ""}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                              <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outfit Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Casual Friday"
                />
              </div>
              <div className="space-y-2">
                <Label>Occasion</Label>
                <Select value={occasionType} onValueChange={setOccasionType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OCCASION_TYPES.map((occ) => (
                      <SelectItem key={occ.value} value={occ.value}>
                        {occ.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Selected Items ({selectedItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Click items on the left to add them to your outfit
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 rounded-lg bg-muted"
                    >
                      {item.photoUrls[0] ? (
                        <img
                          src={item.photoUrls[0]}
                          alt={item.category}
                          className="h-10 w-10 rounded object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded bg-background flex items-center justify-center text-xs">
                          {item.category.charAt(0)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {item.category}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.colorPrimary}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleItem(item)}
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
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            onClick={handleSave}
            disabled={isSaving || selectedItems.length === 0 || !name.trim()}
          >
            {isSaving ? "Saving..." : "Create Outfit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
