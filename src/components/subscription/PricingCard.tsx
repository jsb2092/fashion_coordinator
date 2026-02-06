"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PricingCardProps {
  name: string;
  price: number;
  period: string;
  features: string[];
  isCurrentPlan?: boolean;
  isRecommended?: boolean;
  onSelect?: () => void;
  isLoading?: boolean;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
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
  );
}

export function PricingCard({
  name,
  price,
  period,
  features,
  isCurrentPlan,
  isRecommended,
  onSelect,
  isLoading,
}: PricingCardProps) {
  return (
    <Card className={isRecommended ? "border-primary" : undefined}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{name}</CardTitle>
          {isRecommended && (
            <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
              RECOMMENDED
            </span>
          )}
        </div>
        <CardDescription>
          <span className="text-3xl font-bold">${price}</span>
          <span className="text-muted-foreground">/{period}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-2">
              <CheckIcon
                className={`h-5 w-5 shrink-0 mt-0.5 ${
                  isRecommended ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        {isCurrentPlan ? (
          <Button variant="outline" className="w-full mt-6" disabled>
            Current Plan
          </Button>
        ) : onSelect ? (
          <Button
            className="w-full mt-6"
            onClick={onSelect}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : "Select Plan"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
