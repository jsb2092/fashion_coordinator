"use client";

import { useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OnboardingProgress } from "./OnboardingProgress";
import { WelcomeStep } from "./steps/WelcomeStep";
import { FeaturesStep } from "./steps/FeaturesStep";
import { UploadStep } from "./steps/UploadStep";
import { AnalysisStep } from "./steps/AnalysisStep";
import { PreferencesStep } from "./steps/PreferencesStep";
import { CompletionStep } from "./steps/CompletionStep";
import { completeOnboarding, skipOnboarding } from "@/lib/onboarding/actions";
import { createWardrobeItem } from "@/lib/actions";
import { InterestId } from "@/lib/onboarding/config";
import { ClothingAnalysis } from "@/lib/claude";

interface OnboardingWizardProps {
  onClose?: () => void;
}

type Step = "welcome" | "features" | "upload" | "analysis" | "preferences" | "completion";

const STEP_ORDER: Step[] = [
  "welcome",
  "features",
  "upload",
  "analysis",
  "preferences",
  "completion",
];

export function OnboardingWizard({ onClose }: OnboardingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("welcome");
  const [selectedInterests, setSelectedInterests] = useState<InterestId[]>([]);
  const [uploadData, setUploadData] = useState<{
    photoUrls: string[];
    analysis: ClothingAnalysis;
  } | null>(null);
  const [preferences, setPreferences] = useState<{
    preferredColors?: string[];
    preferredStyle?: string;
  }>({});
  const [firstItemId, setFirstItemId] = useState<string | null>(null);

  const currentStepIndex = STEP_ORDER.indexOf(currentStep);

  const goToStep = (step: Step) => setCurrentStep(step);
  const goNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEP_ORDER.length) {
      setCurrentStep(STEP_ORDER[nextIndex]);
    }
  };
  const goBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEP_ORDER[prevIndex]);
    }
  };

  const handleSkip = async () => {
    await skipOnboarding({ interests: selectedInterests });
    onClose?.();
  };

  const handleComplete = async () => {
    await completeOnboarding({
      interests: selectedInterests,
      preferences,
      firstItemId: firstItemId || undefined,
    });
    onClose?.();
  };

  const handleUploadComplete = (data: {
    photoUrls: string[];
    analysis: ClothingAnalysis;
  }) => {
    setUploadData(data);
    goToStep("analysis");
  };

  const handleSaveItem = useCallback(async (): Promise<string | null> => {
    if (!uploadData) return null;
    if (firstItemId) return firstItemId; // Already saved

    try {
      const item = await createWardrobeItem({
        photoUrls: uploadData.photoUrls,
        category: uploadData.analysis.category,
        subcategory: uploadData.analysis.subcategory || undefined,
        colorPrimary: uploadData.analysis.colorPrimary,
        colorSecondary: uploadData.analysis.colorSecondary || undefined,
        pattern: uploadData.analysis.pattern || undefined,
        brand: uploadData.analysis.brandGuess || undefined,
        material: uploadData.analysis.material || undefined,
        formalityLevel: uploadData.analysis.formalityLevel,
        construction: uploadData.analysis.construction || undefined,
        seasonSuitability: uploadData.analysis.seasonSuitability || ["ALL_SEASON"],
        aiAnalysis: uploadData.analysis as unknown as Record<string, unknown>,
      });
      setFirstItemId(item.id);
      return item.id;
    } catch (error) {
      console.error("Failed to save item:", error);
      return null;
    }
  }, [uploadData, firstItemId]);

  const handlePreferencesComplete = (prefs: {
    preferredColors?: string[];
    preferredStyle?: string;
  }) => {
    setPreferences(prefs);
    goToStep("completion");
  };

  const handleSkipUpload = () => {
    // Skip to preferences if no upload
    goToStep("preferences");
  };

  const handleSkipPreferences = () => {
    goToStep("completion");
  };

  // Calculate progress (6 steps total)
  const totalSteps = 6;
  const progressStep = currentStepIndex;

  return (
    <Dialog open={true}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <div className="flex items-center justify-between mb-6">
          <OnboardingProgress currentStep={progressStep} totalSteps={totalSteps} />
          {currentStep !== "completion" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip setup
            </Button>
          )}
        </div>

        {currentStep === "welcome" && (
          <WelcomeStep
            selectedInterests={selectedInterests}
            onInterestsChange={setSelectedInterests}
            onNext={goNext}
          />
        )}

        {currentStep === "features" && (
          <FeaturesStep
            selectedInterests={selectedInterests}
            onNext={goNext}
            onBack={goBack}
          />
        )}

        {currentStep === "upload" && (
          <UploadStep
            selectedInterests={selectedInterests}
            onUploadComplete={handleUploadComplete}
            onBack={goBack}
            onSkip={handleSkipUpload}
          />
        )}

        {currentStep === "analysis" && uploadData && (
          <AnalysisStep
            photoUrls={uploadData.photoUrls}
            analysis={uploadData.analysis}
            onNext={goNext}
            onSaveItem={handleSaveItem}
          />
        )}

        {currentStep === "preferences" && (
          <PreferencesStep
            onComplete={handlePreferencesComplete}
            onSkip={handleSkipPreferences}
            onBack={() => {
              // Go back to upload or analysis depending on whether we have upload data
              goToStep(uploadData ? "analysis" : "upload");
            }}
          />
        )}

        {currentStep === "completion" && (
          <CompletionStep
            selectedInterests={selectedInterests}
            onComplete={handleComplete}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
