"use client";

import { useState } from "react";
import { CareSupply, ShoeSupplyLink, WardrobeItem } from "@prisma/client";
import { CareSupplyCard } from "./CareSupplyCard";
import { SupplyDetailModal } from "./SupplyDetailModal";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPLY_CATEGORIES, SUPPLY_STATUSES } from "@/constants/careSupplies";
import { updateCareSupply, recordSupplyUsage } from "@/lib/actions";
import { toast } from "sonner";

type CareSupplyWithLinks = CareSupply & {
  shoeLinks: (ShoeSupplyLink & { wardrobeItem: WardrobeItem })[];
};

interface CareSupplyGridProps {
  supplies: CareSupplyWithLinks[];
  shoes: WardrobeItem[];
}

export function CareSupplyGrid({ supplies, shoes }: CareSupplyGridProps) {
  const [selectedSupply, setSelectedSupply] = useState<CareSupplyWithLinks | null>(null);
  const [editSupply, setEditSupply] = useState<CareSupplyWithLinks | null>(null);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!selectedSupply) return;
    setIsChangingStatus(true);
    try {
      await updateCareSupply(selectedSupply.id, { status: newStatus });
      setSelectedSupply({ ...selectedSupply, status: newStatus as CareSupply["status"] });
      toast.success(`Status changed to ${SUPPLY_STATUSES.find(s => s.value === newStatus)?.label || newStatus}`);
    } catch {
      toast.error("Failed to update status");
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleRecordUsage = async () => {
    if (!selectedSupply) return;
    try {
      await recordSupplyUsage(selectedSupply.id);
      setSelectedSupply({
        ...selectedSupply,
        timesUsed: selectedSupply.timesUsed + 1,
        lastUsed: new Date(),
      });
      toast.success("Usage recorded");
    } catch {
      toast.error("Failed to record usage");
    }
  };

  if (supplies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-6 mb-4">
          <svg
            className="h-12 w-12 text-muted-foreground"
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
        <h3 className="text-lg font-semibold">No supplies yet</h3>
        <p className="text-muted-foreground mt-1">
          Add your shoe care supplies to track your inventory
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {supplies.map((supply) => (
          <CareSupplyCard
            key={supply.id}
            supply={supply}
            onClick={() => setSelectedSupply(supply)}
          />
        ))}
      </div>

      {/* Quick View Modal */}
      <Dialog open={!!selectedSupply} onOpenChange={(open) => !open && setSelectedSupply(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden">
          {selectedSupply && (
            <div className="flex flex-col md:flex-row">
              {/* Photo Side */}
              <div className="md:w-1/2 bg-muted flex items-center justify-center min-h-[300px] md:min-h-[500px]">
                {selectedSupply.photoUrls[0] ? (
                  <img
                    src={selectedSupply.photoUrls[0]}
                    alt={selectedSupply.name}
                    className="max-w-full max-h-[50vh] md:max-h-[500px] object-contain"
                  />
                ) : (
                  <div className="text-center text-muted-foreground p-8">
                    <svg
                      className="h-16 w-16 mx-auto mb-2"
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
                    <p className="text-lg font-medium">{selectedSupply.name}</p>
                  </div>
                )}
              </div>

              {/* Details Side */}
              <div className="md:w-1/2 p-6 overflow-y-auto max-h-[50vh] md:max-h-[500px]">
                <h2 className="text-xl font-semibold mb-1">{selectedSupply.name}</h2>
                {selectedSupply.subcategory && (
                  <p className="text-muted-foreground mb-4">{selectedSupply.subcategory}</p>
                )}

                <div className="space-y-4">
                  {/* Quick Status Change */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">Status:</span>
                    <Select
                      value={selectedSupply.status}
                      onValueChange={handleQuickStatusChange}
                      disabled={isChangingStatus}
                    >
                      <SelectTrigger className="w-[160px] h-8">
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

                  {/* Category */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">Category:</span>
                    <Badge variant="outline">
                      {SUPPLY_CATEGORIES.find(c => c.value === selectedSupply.category)?.label || selectedSupply.category}
                    </Badge>
                  </div>

                  {/* Brand */}
                  {selectedSupply.brand && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">Brand:</span>
                      <span className="font-medium">{selectedSupply.brand}</span>
                    </div>
                  )}

                  {/* Color */}
                  {selectedSupply.color && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">Color:</span>
                      <Badge variant="outline">{selectedSupply.color}</Badge>
                    </div>
                  )}

                  {/* Quantity */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-20">Quantity:</span>
                    <span>
                      {selectedSupply.quantity}
                      {selectedSupply.quantityUnit && ` ${selectedSupply.quantityUnit}`}
                    </span>
                  </div>

                  {/* Rating */}
                  {selectedSupply.rating && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">Rating:</span>
                      <span className="text-yellow-500">
                        {"★".repeat(selectedSupply.rating)}{"☆".repeat(5 - selectedSupply.rating)}
                      </span>
                    </div>
                  )}

                  {/* Reorder Link */}
                  {selectedSupply.reorderUrl && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-20">Reorder:</span>
                      <a
                        href={selectedSupply.reorderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Order link
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                        </svg>
                      </a>
                    </div>
                  )}

                  {/* Compatible Colors */}
                  {selectedSupply.compatibleColors.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-muted-foreground w-20 pt-0.5">For colors:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedSupply.compatibleColors.map((color) => (
                          <Badge key={color} variant="secondary" className="text-xs">
                            {color}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compatible Materials */}
                  {selectedSupply.compatibleMaterials.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-muted-foreground w-20 pt-0.5">For materials:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedSupply.compatibleMaterials.map((material) => (
                          <Badge key={material} variant="secondary" className="text-xs">
                            {material}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Linked Shoes */}
                  {selectedSupply.shoeLinks.length > 0 && (
                    <div className="flex items-start gap-3">
                      <span className="text-sm text-muted-foreground w-20 pt-0.5">Linked:</span>
                      <div className="flex flex-wrap gap-1">
                        {selectedSupply.shoeLinks.map((link) => (
                          <Badge key={link.id} variant="outline" className="text-xs">
                            {link.wardrobeItem.category}
                            {link.isPrimary && " *"}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {selectedSupply.notes && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">{selectedSupply.notes}</p>
                    </div>
                  )}

                  {/* Usage Stats */}
                  <div className="pt-2 border-t text-sm text-muted-foreground">
                    <p>Used {selectedSupply.timesUsed} times</p>
                    {selectedSupply.lastUsed && (
                      <p>Last used: {new Date(selectedSupply.lastUsed).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 mt-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecordUsage}
                  >
                    Record Use
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setEditSupply(selectedSupply);
                      setSelectedSupply(null);
                    }}
                  >
                    Edit Supply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Full Edit Modal */}
      <SupplyDetailModal
        supply={editSupply}
        shoes={shoes}
        isOpen={!!editSupply}
        onClose={() => setEditSupply(null)}
      />
    </>
  );
}
