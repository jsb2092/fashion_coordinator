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
import { SUPPLY_CATEGORIES, SUPPLY_STATUSES } from "@/constants/careSupplies";

export function SupplyFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateFilter = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/shoe-care?${params.toString()}`);
  };

  const clearFilters = () => {
    router.push("/shoe-care");
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
            placeholder="Search supplies..."
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
              {SUPPLY_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
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
              <SelectItem value="all">All statuses</SelectItem>
              {SUPPLY_STATUSES.map((status) => (
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
