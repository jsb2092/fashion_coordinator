"use client";

import { INTEREST_FEATURES, InterestId } from "@/lib/onboarding/config";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface FeaturesStepProps {
  selectedInterests: InterestId[];
  onNext: () => void;
  onBack: () => void;
}

export function FeaturesStep({
  selectedInterests,
  onNext,
  onBack,
}: FeaturesStepProps) {
  // Get unique features from selected interests (max 6)
  const features = selectedInterests
    .flatMap((interest) => INTEREST_FEATURES[interest] || [])
    .filter(
      (feature, index, self) =>
        self.findIndex((f) => f.title === feature.title) === index
    )
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Here&apos;s what you can do</h2>
        <p className="text-muted-foreground">
          Based on your interests, these features will help you most
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {features.map((feature, index) => (
          <Card
            key={index}
            className="p-4 border-muted bg-muted/30"
          >
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <svg
                  className="h-4 w-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <div>
                <p className="font-medium">{feature.title}</p>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} size="lg">
          Let&apos;s add your first item
        </Button>
      </div>
    </div>
  );
}
