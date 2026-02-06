"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { PLANS } from "@/lib/stripe";

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

export default function PricingPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const canceled = searchParams.get("canceled");
  if (canceled) {
    toast.error("Checkout was canceled");
  }

  const handleUpgrade = async (billingPeriod: "monthly" | "yearly") => {
    setIsLoading(billingPeriod);
    try {
      const priceId = billingPeriod === "monthly"
        ? process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID
        : process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID;

      if (!priceId) {
        toast.error("Pricing is not configured yet");
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId, billingPeriod }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (error) {
      console.error("Upgrade error:", error);
      toast.error("Failed to start checkout. Please try again.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Upgrade to Pro</h1>
        <p className="text-muted-foreground">
          Unlock the full potential of Outfit IQ
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Free Tier */}
        <Card>
          <CardHeader>
            <CardTitle>{PLANS.free.name}</CardTitle>
            <CardDescription>
              <span className="text-3xl font-bold">$0</span>
              <span className="text-muted-foreground">/month</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLANS.free.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <Button variant="outline" className="w-full mt-6" disabled>
              Current Plan
            </Button>
          </CardContent>
        </Card>

        {/* Pro Tier */}
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{PLANS.pro.name}</CardTitle>
              <span className="bg-primary text-primary-foreground text-xs font-medium px-2 py-1 rounded">
                RECOMMENDED
              </span>
            </div>
            <CardDescription>
              <div className="space-y-1">
                <div>
                  <span className="text-3xl font-bold">${PLANS.pro.monthlyPrice}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  or ${PLANS.pro.yearlyPrice}/year (save ${PLANS.pro.monthlyPrice * 12 - PLANS.pro.yearlyPrice})
                </div>
              </div>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLANS.pro.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckIcon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-2 mt-6">
              <Button
                className="w-full"
                onClick={() => handleUpgrade("monthly")}
                disabled={isLoading !== null}
              >
                {isLoading === "monthly" ? "Loading..." : "Subscribe Monthly"}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleUpgrade("yearly")}
                disabled={isLoading !== null}
              >
                {isLoading === "yearly" ? "Loading..." : "Subscribe Yearly (Save 38%)"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>Cancel anytime. Your subscription will continue until the end of the billing period.</p>
      </div>
    </div>
  );
}
