"use client";

import { useState } from "react";
import { WardrobeItem } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface CareInstructions {
  title: string;
  suppliesNeeded: {
    name: string;
    purpose: string;
    owned: boolean;
  }[];
  steps: {
    step: number;
    title: string;
    description: string;
    supplyUsed?: string;
    duration?: string;
    tips?: string;
  }[];
  frequency: string;
  warnings?: string[];
  quickMaintenanceTips: string[];
}

interface PolishInstructionsProps {
  shoes: WardrobeItem[];
  suppliesCount: number;
}

export function PolishInstructions({ shoes, suppliesCount }: PolishInstructionsProps) {
  const [selectedShoe, setSelectedShoe] = useState<WardrobeItem | null>(null);
  const [careType, setCareType] = useState<"full_polish" | "quick_clean" | "deep_condition">("full_polish");
  const [instructions, setInstructions] = useState<CareInstructions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const fetchInstructions = async () => {
    if (!selectedShoe) return;

    setIsLoading(true);
    setInstructions(null);
    setCurrentStep(0);

    try {
      const res = await fetch("/api/shoe-care/instructions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shoeId: selectedShoe.id,
          careType,
        }),
      });

      if (!res.ok) throw new Error("Failed to get instructions");

      const data = await res.json();
      setInstructions(data);
    } catch (error) {
      console.error("Error fetching instructions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (suppliesCount === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            You need to add some shoe care supplies first to get personalized instructions.
          </p>
          <Link href="/shoe-care/add">
            <Button>Add Supplies</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  if (shoes.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            No shoes found in your wardrobe. Add some dress shoes, boots, or casual leather shoes first.
          </p>
          <Link href="/wardrobe/upload">
            <Button>Add Shoes</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // Show instructions if we have them
  if (instructions) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold">{instructions.title}</h2>
            <p className="text-sm text-muted-foreground">{instructions.frequency}</p>
          </div>
          <Button variant="outline" onClick={() => setInstructions(null)}>
            Pick Different Shoe
          </Button>
        </div>

        {/* Warnings */}
        {instructions.warnings && instructions.warnings.length > 0 && (
          <Card className="border-yellow-500/50 bg-yellow-500/5">
            <CardContent className="py-4">
              <div className="flex gap-2">
                <svg className="h-5 w-5 text-yellow-600 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
                <div className="text-sm">
                  {instructions.warnings.map((warning, i) => (
                    <p key={i}>{warning}</p>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Supplies Needed */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supplies Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {instructions.suppliesNeeded.map((supply, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className={cn("font-medium", !supply.owned && "text-muted-foreground")}>
                      {supply.name}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">— {supply.purpose}</span>
                  </div>
                  {supply.owned ? (
                    <Badge variant="default" className="bg-green-600">You have this</Badge>
                  ) : (
                    <Badge variant="outline" className="text-yellow-600 border-yellow-600">Need to get</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {instructions.steps.map((step, i) => (
              <div
                key={step.step}
                className={cn(
                  "p-4 rounded-lg border transition-all",
                  currentStep === i ? "border-primary bg-primary/5" : "border-transparent"
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-semibold",
                      currentStep > i
                        ? "bg-green-600 text-white"
                        : currentStep === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > i ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    ) : (
                      step.step
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{step.title}</h4>
                      {step.duration && (
                        <Badge variant="secondary" className="text-xs">{step.duration}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.supplyUsed && (
                      <p className="text-sm mt-2">
                        <span className="text-muted-foreground">Use:</span>{" "}
                        <span className="font-medium">{step.supplyUsed}</span>
                      </p>
                    )}
                    {step.tips && (
                      <p className="text-sm mt-2 text-primary">
                        <span className="font-medium">Tip:</span> {step.tips}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Step Navigation */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                onClick={() => {
                  if (currentStep === instructions.steps.length - 1) {
                    // Done - reset to shoe selection
                    setInstructions(null);
                    setSelectedShoe(null);
                    setCurrentStep(0);
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="flex-1"
              >
                {currentStep === instructions.steps.length - 1 ? "Done!" : "Next Step"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Maintenance Tips */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Maintenance Tips</CardTitle>
            <p className="text-sm text-muted-foreground">Between full polishes</p>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {instructions.quickMaintenanceTips.map((tip, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary">•</span>
                  {tip}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Shoe selection UI
  return (
    <div className="space-y-6">
      {/* Care Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What type of care?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {[
              { value: "quick_clean", label: "Quick Clean", desc: "Brush, wipe, shoe trees (after each wear)" },
              { value: "full_polish", label: "Regular Polish", desc: "Cream polish and buff, no cleaning (every 4-6 wears)" },
              { value: "deep_condition", label: "Full Treatment", desc: "Saddle soap, condition, and polish (monthly)" },
            ].map((option) => (
              <div
                key={option.value}
                onClick={() => setCareType(option.value as typeof careType)}
                className={cn(
                  "cursor-pointer rounded-lg border p-3 transition-all",
                  careType === option.value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-muted-foreground/30"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "h-4 w-4 rounded-full border-2 flex items-center justify-center",
                      careType === option.value ? "border-primary" : "border-muted-foreground/30"
                    )}
                  >
                    {careType === option.value && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Shoe Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select a shoe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {shoes.map((shoe) => {
              const isSelected = selectedShoe?.id === shoe.id;
              const imageUrl = shoe.photoUrls && shoe.photoUrls.length > 0 ? shoe.photoUrls[0] : null;
              return (
                <div
                  key={shoe.id}
                  onClick={() => setSelectedShoe(isSelected ? null : shoe)}
                  className={cn(
                    "cursor-pointer rounded-lg border-2 overflow-hidden transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <div className="aspect-square bg-muted relative">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={shoe.category}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{shoe.category}</p>
                    <p className="text-xs text-muted-foreground truncate">{shoe.colorPrimary}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Get Instructions Button */}
      <Button
        onClick={fetchInstructions}
        disabled={!selectedShoe || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Generating Instructions...
          </>
        ) : (
          <>
            Get Care Instructions
            {selectedShoe && ` for ${selectedShoe.colorPrimary} ${selectedShoe.category}`}
          </>
        )}
      </Button>
    </div>
  );
}
