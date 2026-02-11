"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhotoUploader } from "@/components/wardrobe/PhotoUploader";
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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  CATEGORIES,
  FORMALITY_LEVELS,
  SEASONS,
  PATTERNS,
} from "@/constants/categories";
import { createWardrobeItem } from "@/lib/actions";
import { toast } from "sonner";

interface AnalysisResult {
  category: string;
  subcategory: string | null;
  colorPrimary: string;
  colorSecondary: string | null;
  pattern: string;
  material: string | null;
  formalityLevel: number;
  construction: string | null;
  seasonSuitability: string[];
  brandGuess: string | null;
  styleNotes: string;
}

export default function UploadPage() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [formData, setFormData] = useState<Partial<AnalysisResult>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [description, setDescription] = useState("");

  const currentData = analysis ? { ...analysis, ...formData } : null;

  const handleUpload = async (files: File[]) => {
    setIsUploading(true);
    try {
      const urls: string[] = [];

      for (const file of files) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        });

        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.error || "Failed to upload");
        }

        const { url } = await res.json();
        urls.push(url);
      }

      setUploadedUrls(urls);

      if (urls.length > 0) {
        const analyzeRes = await fetch("/api/upload/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrls: urls, description: description || undefined }),
        });

        if (!analyzeRes.ok) {
          throw new Error("Failed to analyze image");
        }

        const analysisData = await analyzeRes.json();
        setAnalysis(analysisData);
        toast.success("Image analyzed successfully");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload and analyze image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!currentData) return;

    setIsSaving(true);
    try {
      await createWardrobeItem({
        photoUrls: uploadedUrls,
        category: currentData.category,
        subcategory: currentData.subcategory || undefined,
        colorPrimary: currentData.colorPrimary,
        colorSecondary: currentData.colorSecondary || undefined,
        pattern: currentData.pattern || undefined,
        brand: currentData.brandGuess || undefined,
        material: currentData.material || undefined,
        formalityLevel: currentData.formalityLevel,
        construction: currentData.construction || undefined,
        seasonSuitability: currentData.seasonSuitability,
        notes: currentData.styleNotes || undefined,
        aiAnalysis: analysis as unknown as Record<string, unknown>,
      });

      toast.success("Item added to wardrobe");
      router.push("/wardrobe");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save item");
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof AnalysisResult, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
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

      <h1 className="text-2xl font-bold mb-6">Add New Item</h1>

      {!analysis ? (
        <Card>
          <CardHeader>
            <CardTitle>Upload Photos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Help the AI by describing this item, e.g. 'Navy blue quarter-zip sweater from J.Crew, 100% merino wool'"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
              <p className="text-xs text-muted-foreground">
                Add details the AI might not see: brand, material, or specific style notes
              </p>
            </div>
            <PhotoUploader onUpload={handleUpload} isUploading={isUploading} />
            {isUploading && (
              <p className="text-center text-muted-foreground mt-4">
                Uploading and analyzing with AI...
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Photo</CardTitle>
            </CardHeader>
            <CardContent>
              {uploadedUrls[0] && (
                <img
                  src={uploadedUrls[0]}
                  alt="Uploaded item"
                  className="w-full aspect-square object-cover rounded-lg"
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
              <p className="text-sm text-muted-foreground">
                Review and adjust the detected attributes
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={currentData?.category}
                    onValueChange={(v) => updateField("category", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Subcategory</Label>
                  <Input
                    value={currentData?.subcategory || ""}
                    onChange={(e) => updateField("subcategory", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <Input
                    value={currentData?.colorPrimary || ""}
                    onChange={(e) => updateField("colorPrimary", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <Input
                    value={currentData?.colorSecondary || ""}
                    onChange={(e) => updateField("colorSecondary", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Pattern</Label>
                  <Select
                    value={currentData?.pattern || "Solid"}
                    onValueChange={(v) => updateField("pattern", v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PATTERNS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Material</Label>
                  <Input
                    value={currentData?.material || ""}
                    onChange={(e) => updateField("material", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Input
                    value={currentData?.brandGuess || ""}
                    onChange={(e) => updateField("brandGuess", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Formality</Label>
                  <Select
                    value={currentData?.formalityLevel?.toString()}
                    onValueChange={(v) => updateField("formalityLevel", parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMALITY_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value.toString()}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Seasons</Label>
                <div className="flex flex-wrap gap-2">
                  {SEASONS.map((season) => (
                    <Badge
                      key={season}
                      variant={
                        currentData?.seasonSuitability?.includes(season)
                          ? "default"
                          : "outline"
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const current = currentData?.seasonSuitability || [];
                        const updated = current.includes(season)
                          ? current.filter((s) => s !== season)
                          : [...current, season];
                        updateField("seasonSuitability", updated);
                      }}
                    >
                      {season.replace("_", " ")}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Style Notes</Label>
                <Textarea
                  value={currentData?.styleNotes || ""}
                  onChange={(e) => updateField("styleNotes", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setAnalysis(null);
                    setUploadedUrls([]);
                    setFormData({});
                    setDescription("");
                  }}
                >
                  Upload Different Photo
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Add to Wardrobe"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
