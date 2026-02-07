"use client";

import { useRouter, useSearchParams } from "next/navigation";
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
import {
  CATEGORIES,
  FORMALITY_LEVELS,
  SEASONS,
  ITEM_STATUSES,
} from "@/constants/categories";

export function ItemFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

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
  };

  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Filters</h3>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search items..."
            defaultValue={searchParams.get("search") || ""}
            onChange={(e) => {
              const value = e.target.value;
              if (value) {
                updateFilter("search", value);
              } else {
                updateFilter("search", null);
              }
            }}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="category">Category</Label>
          <Select
            value={searchParams.get("category") || "all"}
            onValueChange={(value) => updateFilter("category", value)}
          >
            <SelectTrigger id="category">
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

        <div className="space-y-1.5">
          <Label htmlFor="formality">Formality</Label>
          <Select
            value={searchParams.get("formality") || "all"}
            onValueChange={(value) => updateFilter("formality", value)}
          >
            <SelectTrigger id="formality">
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

        <div className="space-y-1.5">
          <Label htmlFor="season">Season</Label>
          <Select
            value={searchParams.get("season") || "all"}
            onValueChange={(value) => updateFilter("season", value)}
          >
            <SelectTrigger id="season">
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

        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select
            value={searchParams.get("status") || "all"}
            onValueChange={(value) => updateFilter("status", value)}
          >
            <SelectTrigger id="status">
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
    </div>
  );
}
