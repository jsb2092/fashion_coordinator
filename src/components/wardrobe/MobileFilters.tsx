"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CATEGORIES,
  FORMALITY_LEVELS,
  SEASONS,
  ITEM_STATUSES,
} from "@/constants/categories";

export function MobileFilters() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterCount = Array.from(searchParams.keys()).length;

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/wardrobe?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/wardrobe");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
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
              d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75"
            />
          </svg>
          Filter
          {filterCount > 0 && (
            <span className="ml-1.5 h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              {filterCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Filter Items</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Search */}
          <div className="space-y-2">
            <Label htmlFor="mobile-search" className="text-base">Search</Label>
            <Input
              id="mobile-search"
              placeholder="Search items..."
              className="h-12 text-base"
              defaultValue={searchParams.get("search") || ""}
              onChange={(e) => updateFilter("search", e.target.value || null)}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label className="text-base">Category</Label>
            <Select
              value={searchParams.get("category") || "all"}
              onValueChange={(value) => updateFilter("category", value)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="All categories" />
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

          {/* Formality */}
          <div className="space-y-2">
            <Label className="text-base">Formality</Label>
            <Select
              value={searchParams.get("formality") || "all"}
              onValueChange={(value) => updateFilter("formality", value)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="All levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All levels</SelectItem>
                {FORMALITY_LEVELS.map((level) => (
                  <SelectItem key={level.value} value={level.value.toString()}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Season */}
          <div className="space-y-2">
            <Label className="text-base">Season</Label>
            <Select
              value={searchParams.get("season") || "all"}
              onValueChange={(value) => updateFilter("season", value)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="All seasons" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All seasons</SelectItem>
                {SEASONS.map((season) => (
                  <SelectItem key={season} value={season}>
                    {season.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <Label className="text-base">Status</Label>
            <Select
              value={searchParams.get("status") || "all"}
              onValueChange={(value) => updateFilter("status", value)}
            >
              <SelectTrigger className="h-12 text-base">
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Available (default)</SelectItem>
                {ITEM_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            className="flex-1 h-12"
            onClick={clearFilters}
          >
            Clear all
          </Button>
          <Button
            className="flex-1 h-12"
            onClick={() => setOpen(false)}
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
