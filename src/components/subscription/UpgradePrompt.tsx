"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UpgradePromptProps {
  feature: string;
  description?: string;
  usageInfo?: {
    used: number;
    limit: number;
  };
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
      />
    </svg>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

export function UpgradePrompt({ feature, description, usageInfo }: UpgradePromptProps) {
  return (
    <Card className="border-dashed">
      <CardHeader className="text-center">
        <div className="mx-auto mb-2 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          {usageInfo ? (
            <LockIcon className="h-6 w-6 text-primary" />
          ) : (
            <SparklesIcon className="h-6 w-6 text-primary" />
          )}
        </div>
        <CardTitle className="text-lg">
          {usageInfo ? "Usage Limit Reached" : `Upgrade to Pro`}
        </CardTitle>
        <CardDescription>
          {usageInfo
            ? `You've used ${usageInfo.used} of ${usageInfo.limit} ${feature} this month`
            : description || `${feature} requires a Pro subscription`}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <Link href="/pricing">
          <Button>
            {usageInfo ? "Upgrade for Unlimited Access" : "Upgrade to Pro"}
          </Button>
        </Link>
        <p className="mt-2 text-xs text-muted-foreground">
          Starting at $8/month
        </p>
      </CardContent>
    </Card>
  );
}

export function UpgradePromptInline({ feature, description }: { feature: string; description?: string }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
      <SparklesIcon className="h-5 w-5 text-primary shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{feature}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      <Link href="/pricing">
        <Button size="sm" variant="outline">
          Upgrade
        </Button>
      </Link>
    </div>
  );
}
