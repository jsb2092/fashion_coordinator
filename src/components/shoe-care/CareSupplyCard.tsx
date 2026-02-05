"use client";

import { CareSupply } from "@prisma/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SUPPLY_CATEGORIES, SUPPLY_STATUSES } from "@/constants/careSupplies";

interface CareSupplyCardProps {
  supply: CareSupply;
  onClick?: () => void;
}

function getStatusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "IN_STOCK":
      return "default";
    case "LOW_STOCK":
      return "secondary";
    case "OUT_OF_STOCK":
      return "destructive";
    case "ORDERED":
      return "outline";
    case "DISCONTINUED":
      return "destructive";
    default:
      return "default";
  }
}

export function CareSupplyCard({ supply, onClick }: CareSupplyCardProps) {
  const categoryLabel =
    SUPPLY_CATEGORIES.find((c) => c.value === supply.category)?.label ||
    supply.category;
  const statusLabel =
    SUPPLY_STATUSES.find((s) => s.value === supply.status)?.label ||
    supply.status;

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:ring-2 hover:ring-primary"
      onClick={onClick}
    >
      <div className="aspect-square relative bg-muted">
        {supply.photoUrls[0] ? (
          <img
            src={supply.photoUrls[0]}
            alt={supply.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <svg
              className="h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
              />
            </svg>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant={getStatusVariant(supply.status)} className="text-xs">
            {statusLabel}
          </Badge>
        </div>
        {supply.status !== "IN_STOCK" && (
          <div className="absolute top-2 right-2">
            <Badge variant={getStatusVariant(supply.status)} className="text-xs">
              {statusLabel}
            </Badge>
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-medium text-sm truncate">{supply.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {categoryLabel}
          {supply.brand && ` · ${supply.brand}`}
        </p>
        {supply.quantity > 1 && (
          <p className="text-xs text-muted-foreground">
            Qty: {supply.quantity}
            {supply.quantityUnit && ` ${supply.quantityUnit}`}
          </p>
        )}
      </div>
    </Card>
  );
}
