"use client";

import { INTERESTS, InterestId } from "@/lib/onboarding/config";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface WelcomeStepProps {
  selectedInterests: InterestId[];
  onInterestsChange: (interests: InterestId[]) => void;
  onNext: () => void;
}

export function WelcomeStep({
  selectedInterests,
  onInterestsChange,
  onNext,
}: WelcomeStepProps) {
  const toggleInterest = (id: InterestId) => {
    if (selectedInterests.includes(id)) {
      onInterestsChange(selectedInterests.filter((i) => i !== id));
    } else {
      onInterestsChange([...selectedInterests, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Welcome to Outfit IQ</h2>
        <p className="text-muted-foreground">
          Let&apos;s personalize your experience. What are you most interested in?
        </p>
      </div>

      <div className="space-y-3">
        {INTERESTS.map((interest) => (
          <div
            key={interest.id}
            onClick={() => toggleInterest(interest.id)}
            className={cn(
              "flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-all",
              selectedInterests.includes(interest.id)
                ? "border-primary bg-primary/5"
                : "border-muted hover:border-muted-foreground/30"
            )}
          >
            <Checkbox
              checked={selectedInterests.includes(interest.id)}
              onCheckedChange={() => toggleInterest(interest.id)}
              className="mt-0.5"
            />
            <div className="flex-1">
              <p className="font-medium">{interest.label}</p>
              <p className="text-sm text-muted-foreground">
                {interest.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={selectedInterests.length === 0}
          size="lg"
        >
          Continue
        </Button>
      </div>
    </div>
  );
}
