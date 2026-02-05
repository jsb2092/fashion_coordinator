"use client";

import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function OnboardingProgress({
  currentStep,
  totalSteps,
}: OnboardingProgressProps) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: totalSteps }).map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1.5 rounded-full transition-all duration-300",
            index === currentStep
              ? "w-6 bg-primary"
              : index < currentStep
                ? "w-1.5 bg-primary"
                : "w-1.5 bg-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );
}
