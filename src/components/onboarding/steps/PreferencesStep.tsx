"use client";

import { useState } from "react";
import { STYLE_OPTIONS } from "@/lib/onboarding/config";
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

interface PreferencesStepProps {
  onComplete: (preferences: {
    preferredColors?: string[];
    preferredStyle?: string;
  }) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function PreferencesStep({
  onComplete,
  onSkip,
  onBack,
}: PreferencesStepProps) {
  const [colors, setColors] = useState("");
  const [style, setStyle] = useState("");

  const handleComplete = () => {
    const preferences: {
      preferredColors?: string[];
      preferredStyle?: string;
    } = {};

    if (colors.trim()) {
      preferences.preferredColors = colors
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    }

    if (style) {
      preferences.preferredStyle = style;
    }

    onComplete(preferences);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">A few quick questions</h2>
        <p className="text-muted-foreground">
          This helps us give better suggestions. Feel free to skip.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="colors">What colors do you wear most?</Label>
          <Input
            id="colors"
            placeholder="e.g., navy, gray, white, burgundy"
            value={colors}
            onChange={(e) => setColors(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Separate colors with commas
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="style">What&apos;s your usual style?</Label>
          <Select value={style} onValueChange={setStyle}>
            <SelectTrigger id="style">
              <SelectValue placeholder="Select a style" />
            </SelectTrigger>
            <SelectContent>
              {STYLE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Skip
          </Button>
          <Button onClick={handleComplete} size="lg">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
