"use client";

import { useRouter } from "next/navigation";
import { INTEREST_COMPLETION_CTA, InterestId } from "@/lib/onboarding/config";
import { Button } from "@/components/ui/button";

interface CompletionStepProps {
  selectedInterests: InterestId[];
  onComplete: () => void;
}

export function CompletionStep({
  selectedInterests,
  onComplete,
}: CompletionStepProps) {
  const router = useRouter();

  // Get primary CTA based on first interest
  const primaryInterest = selectedInterests[0] || "general";
  const cta = INTEREST_COMPLETION_CTA[primaryInterest] ||
    INTEREST_COMPLETION_CTA.general;

  const handlePrimaryCTA = () => {
    onComplete();
    router.push(cta.href);
  };

  const handleExplore = () => {
    onComplete();
    router.push("/wardrobe");
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        {/* Success animation */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-2">
          <svg
            className="h-8 w-8 text-green-600"
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

        <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Your wardrobe is ready. Start adding more items or explore what you can do.
        </p>
      </div>

      <div className="flex flex-col gap-3 max-w-xs mx-auto">
        <Button onClick={handlePrimaryCTA} size="lg" className="w-full">
          {cta.text}
        </Button>
        <Button
          variant="outline"
          onClick={handleExplore}
          size="lg"
          className="w-full"
        >
          Explore on my own
        </Button>
      </div>
    </div>
  );
}
