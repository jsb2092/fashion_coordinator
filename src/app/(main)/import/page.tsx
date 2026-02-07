"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const SAMPLE_FORMAT = `[
  {
    "category": "Dress Shirts",
    "subcategory": "Spread collar",
    "colorPrimary": "Light blue",
    "pattern": "Solid",
    "brand": "Charles Tyrwhitt",
    "material": "Cotton",
    "formalityLevel": 4,
    "seasonSuitability": ["SPRING", "SUMMER", "FALL", "WINTER"],
    "notes": "Slim fit 16/34"
  },
  {
    "category": "Chinos",
    "subcategory": "Slim",
    "colorPrimary": "Navy",
    "pattern": "Solid",
    "brand": "Banana Republic",
    "formalityLevel": 3,
    "seasonSuitability": ["ALL_SEASON"]
  }
]`;

interface ImportItem {
  category: string;
  subcategory?: string;
  colorPrimary: string;
  colorSecondary?: string;
  pattern?: string;
  brand?: string;
  material?: string;
  formalityLevel: number;
  construction?: string;
  seasonSuitability: string[];
  notes?: string;
}

export default function ImportPage() {
  const router = useRouter();
  const [jsonInput, setJsonInput] = useState("");
  const [parsedItems, setParsedItems] = useState<ImportItem[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleParse = () => {
    setParseError(null);
    setParsedItems(null);

    try {
      const data = JSON.parse(jsonInput);
      const items = Array.isArray(data) ? data : [data];

      // Validate required fields
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.category) {
          throw new Error(`Item ${i + 1}: missing required field "category"`);
        }
        if (!item.colorPrimary) {
          throw new Error(`Item ${i + 1}: missing required field "colorPrimary"`);
        }
        if (typeof item.formalityLevel !== "number" || item.formalityLevel < 1 || item.formalityLevel > 5) {
          throw new Error(`Item ${i + 1}: "formalityLevel" must be a number between 1 and 5`);
        }
        if (!item.seasonSuitability || !Array.isArray(item.seasonSuitability)) {
          items[i].seasonSuitability = ["ALL_SEASON"];
        }
      }

      setParsedItems(items);
      toast.success(`Parsed ${items.length} item(s) successfully`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON format";
      setParseError(message);
      toast.error("Failed to parse JSON");
    }
  };

  const handleImport = async () => {
    if (!parsedItems || parsedItems.length === 0) return;

    setIsImporting(true);
    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: parsedItems }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Import failed");
      }

      const result = await response.json();
      toast.success(`Successfully imported ${result.count} item(s)`);
      router.push("/wardrobe");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const loadSample = () => {
    setJsonInput(SAMPLE_FORMAT);
    setParsedItems(null);
    setParseError(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Import Wardrobe Items</h1>
      <p className="text-muted-foreground mb-6">
        Bulk import items by pasting JSON data
      </p>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>JSON Data</CardTitle>
            <CardDescription>
              Paste your wardrobe data in JSON format. Each item needs at minimum:
              category, colorPrimary, formalityLevel (1-5), and seasonSuitability.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setParsedItems(null);
                setParseError(null);
              }}
              placeholder="Paste JSON array of wardrobe items..."
              className="font-mono text-sm min-h-[300px]"
            />
            {parseError && (
              <p className="text-sm text-destructive">{parseError}</p>
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={loadSample}>
                Load Sample Format
              </Button>
              <Button onClick={handleParse} disabled={!jsonInput.trim()}>
                Parse JSON
              </Button>
            </div>
          </CardContent>
        </Card>

        {parsedItems && parsedItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Preview ({parsedItems.length} items)</CardTitle>
              <CardDescription>
                Review the items before importing
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                {parsedItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg border bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.colorPrimary}
                        {item.subcategory && ` · ${item.subcategory}`}
                        {item.brand && ` · ${item.brand}`}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Badge variant="outline">F{item.formalityLevel}</Badge>
                      {item.seasonSuitability.map((s) => (
                        <Badge key={s} variant="secondary" className="text-xs">
                          {s.slice(0, 2)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="w-full"
                onClick={handleImport}
                disabled={isImporting}
              >
                {isImporting
                  ? `Importing ${parsedItems.length} items...`
                  : `Import ${parsedItems.length} Items`}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Format Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium mb-2">Required Fields:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code className="text-foreground">category</code> - Item type (e.g., "Dress Shirts")</li>
                  <li><code className="text-foreground">colorPrimary</code> - Main color</li>
                  <li><code className="text-foreground">formalityLevel</code> - 1-5 scale</li>
                  <li><code className="text-foreground">seasonSuitability</code> - Array of seasons</li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-2">Optional Fields:</p>
                <ul className="space-y-1 text-muted-foreground">
                  <li><code className="text-foreground">subcategory</code> - Specific type</li>
                  <li><code className="text-foreground">colorSecondary</code> - Secondary color</li>
                  <li><code className="text-foreground">pattern</code> - Solid, Striped, etc.</li>
                  <li><code className="text-foreground">brand</code> - Brand name</li>
                  <li><code className="text-foreground">material</code> - Cotton, Wool, etc.</li>
                  <li><code className="text-foreground">construction</code> - structured/unstructured</li>
                  <li><code className="text-foreground">notes</code> - Free text notes</li>
                </ul>
              </div>
            </div>
            <div className="mt-4">
              <p className="font-medium mb-2">Valid Seasons:</p>
              <div className="flex flex-wrap gap-1">
                {["SPRING", "SUMMER", "FALL", "WINTER", "ALL_SEASON"].map((s) => (
                  <Badge key={s} variant="outline">{s}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
