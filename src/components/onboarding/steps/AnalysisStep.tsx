"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClothingAnalysis } from "@/lib/claude";

interface AnalysisStepProps {
  photoUrls: string[];
  analysis: ClothingAnalysis;
  onNext: () => void;
  onSaveItem: () => Promise<string | null>; // Returns item ID
}

export function AnalysisStep({
  photoUrls,
  analysis,
  onNext,
  onSaveItem,
}: AnalysisStepProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Auto-save the item when this step is shown
  useEffect(() => {
    const saveItem = async () => {
      setIsSaving(true);
      try {
        await onSaveItem();
        setSaved(true);
      } catch (error) {
        console.error("Failed to save item:", error);
      } finally {
        setIsSaving(false);
      }
    };

    saveItem();
  }, [onSaveItem]);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-2">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold">AI Analysis Complete</h2>
        <p className="text-muted-foreground">
          Here&apos;s what we detected. You can always edit these details later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Photo */}
        <Card className="overflow-hidden">
          {photoUrls[0] && (
            <img
              src={photoUrls[0]}
              alt="Uploaded item"
              className="w-full aspect-square object-cover"
            />
          )}
        </Card>

        {/* Analysis Results */}
        <Card className="p-4 space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Category</p>
            <p className="font-medium">{analysis.category}</p>
            {analysis.subcategory && (
              <p className="text-sm text-muted-foreground">
                {analysis.subcategory}
              </p>
            )}
          </div>

          <div>
            <p className="text-sm text-muted-foreground">Color</p>
            <p className="font-medium capitalize">{analysis.colorPrimary}</p>
            {analysis.colorSecondary && (
              <p className="text-sm text-muted-foreground capitalize">
                Secondary: {analysis.colorSecondary}
              </p>
            )}
          </div>

          {analysis.material && (
            <div>
              <p className="text-sm text-muted-foreground">Material</p>
              <p className="font-medium capitalize">{analysis.material}</p>
            </div>
          )}

          {analysis.pattern && (
            <div>
              <p className="text-sm text-muted-foreground">Pattern</p>
              <p className="font-medium capitalize">{analysis.pattern}</p>
            </div>
          )}

          <div>
            <p className="text-sm text-muted-foreground">Formality</p>
            <div className="flex gap-1 mt-1">
              {[1, 2, 3, 4, 5].map((level) => (
                <div
                  key={level}
                  className={`h-2 w-6 rounded ${
                    level <= analysis.formalityLevel
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {analysis.formalityLevel <= 2
                ? "Casual"
                : analysis.formalityLevel <= 3
                  ? "Smart Casual"
                  : analysis.formalityLevel <= 4
                    ? "Business"
                    : "Formal"}
            </p>
          </div>

          {analysis.seasonSuitability && analysis.seasonSuitability.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground mb-1">Seasons</p>
              <div className="flex flex-wrap gap-1">
                {analysis.seasonSuitability.map((season) => (
                  <Badge key={season} variant="secondary" className="text-xs">
                    {season.replace("_", " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {isSaving && (
        <p className="text-sm text-center text-muted-foreground">
          Saving to your wardrobe...
        </p>
      )}

      {saved && (
        <p className="text-sm text-center text-green-600">
          Added to your wardrobe!
        </p>
      )}

      <div className="flex justify-end">
        <Button onClick={onNext} size="lg" disabled={isSaving}>
          {isSaving ? "Saving..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
