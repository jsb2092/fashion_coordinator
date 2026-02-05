"use client";

import { useState } from "react";
import {
  INTEREST_FIRST_ITEM,
  PHOTO_SOURCE_TIPS,
  InterestId,
} from "@/lib/onboarding/config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PhotoUploader } from "@/components/wardrobe/PhotoUploader";
import { ClothingAnalysis } from "@/lib/claude";

interface UploadStepProps {
  selectedInterests: InterestId[];
  onUploadComplete: (data: {
    photoUrls: string[];
    analysis: ClothingAnalysis;
  }) => void;
  onBack: () => void;
  onSkip: () => void;
}

export function UploadStep({
  selectedInterests,
  onUploadComplete,
  onBack,
  onSkip,
}: UploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get suggestion based on primary interest
  const primaryInterest = selectedInterests[0] || "general";
  const suggestion = INTEREST_FIRST_ITEM[primaryInterest]?.suggestion ||
    INTEREST_FIRST_ITEM.general.suggestion;

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    setError(null);

    try {
      // Upload files
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error("Failed to upload image");
        }

        const { url } = await res.json();
        uploadedUrls.push(url);
      }

      // Analyze with AI
      const analyzeRes = await fetch("/api/upload/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls: uploadedUrls }),
      });

      if (!analyzeRes.ok) {
        throw new Error("Failed to analyze image");
      }

      const analysis = await analyzeRes.json();
      onUploadComplete({ photoUrls: uploadedUrls, analysis });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Add your first item</h2>
        <p className="text-muted-foreground">{suggestion}</p>
      </div>

      <PhotoUploader
        onUpload={handleUpload}
        isUploading={isUploading}
        maxFiles={3}
      />

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      {/* Photo source tips */}
      <Card className="p-4 bg-muted/30 border-muted">
        <p className="text-sm font-medium mb-3">Where to find photos:</p>
        <div className="grid grid-cols-2 gap-3">
          {PHOTO_SOURCE_TIPS.map((tip) => (
            <div key={tip.title} className="flex items-start gap-2">
              <div className="h-5 w-5 rounded bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                {tip.icon === "shopping-bag" && (
                  <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                )}
                {tip.icon === "camera" && (
                  <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
                  </svg>
                )}
                {tip.icon === "screenshot" && (
                  <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                  </svg>
                )}
                {tip.icon === "hanger" && (
                  <svg className="h-3 w-3 text-primary" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-xs font-medium">{tip.title}</p>
                <p className="text-xs text-muted-foreground">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button variant="ghost" onClick={onSkip}>
          Skip for now
        </Button>
      </div>
    </div>
  );
}
