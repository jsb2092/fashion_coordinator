"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { resetOnboarding } from "@/lib/onboarding/actions";

interface Preferences {
  preferredColors?: string[];
  avoidColors?: string[];
  styleNotes?: string;
}

interface Measurements {
  chest?: string;
  waist?: string;
  hips?: string;
  inseam?: string;
  shoeSize?: string;
}

interface SubscriptionData {
  tier: string;
  status: string;
  endDate: string | null;
}

export default function SettingsPage() {
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [preferences, setPreferences] = useState<Preferences>({});
  const [measurements, setMeasurements] = useState<Measurements>({});
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isManagingSubscription, setIsManagingSubscription] = useState(false);

  // Check for success from Stripe checkout
  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast.success("Welcome to Pro! Your subscription is now active.");
      // Clear the URL params
      router.replace("/settings");
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/user");
        if (response.ok) {
          const data = await response.json();
          setPreferences(data.preferences || {});
          setMeasurements(data.measurements || {});
          setSubscription({
            tier: data.subscriptionTier || "free",
            status: data.subscriptionStatus || "inactive",
            endDate: data.subscriptionEndDate || null,
          });
        }
      } catch (error) {
        console.error("Failed to load profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch("/api/user", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences, measurements }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      toast.success("Settings saved successfully");
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="h-64 bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">Settings</h1>
      <p className="text-muted-foreground mb-6">
        Manage your profile and style preferences
      </p>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Your account information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={user?.primaryEmailAddress?.emailAddress || ""}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={user?.fullName || ""} disabled />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Style Preferences</CardTitle>
            <CardDescription>
              Help the AI understand your personal style
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Preferred Colors</Label>
              <Input
                value={preferences.preferredColors?.join(", ") || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    preferredColors: e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Navy, charcoal, burgundy"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list of colors you like to wear
              </p>
            </div>

            <div className="space-y-2">
              <Label>Colors to Avoid</Label>
              <Input
                value={preferences.avoidColors?.join(", ") || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    avoidColors: e.target.value
                      .split(",")
                      .map((c) => c.trim())
                      .filter(Boolean),
                  })
                }
                placeholder="Orange, yellow"
              />
              <p className="text-xs text-muted-foreground">
                Colors you'd prefer not to wear
              </p>
            </div>

            <div className="space-y-2">
              <Label>Style Notes</Label>
              <Textarea
                value={preferences.styleNotes || ""}
                onChange={(e) =>
                  setPreferences({
                    ...preferences,
                    styleNotes: e.target.value,
                  })
                }
                placeholder="I prefer a smart casual look. I work in a business casual office. I like classic, timeless pieces..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Any additional notes about your style preferences
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Measurements</CardTitle>
            <CardDescription>
              Optional sizing information for better recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chest</Label>
                <Input
                  value={measurements.chest || ""}
                  onChange={(e) =>
                    setMeasurements({ ...measurements, chest: e.target.value })
                  }
                  placeholder='42"'
                />
              </div>
              <div className="space-y-2">
                <Label>Waist</Label>
                <Input
                  value={measurements.waist || ""}
                  onChange={(e) =>
                    setMeasurements({ ...measurements, waist: e.target.value })
                  }
                  placeholder='34"'
                />
              </div>
              <div className="space-y-2">
                <Label>Hips</Label>
                <Input
                  value={measurements.hips || ""}
                  onChange={(e) =>
                    setMeasurements({ ...measurements, hips: e.target.value })
                  }
                  placeholder='40"'
                />
              </div>
              <div className="space-y-2">
                <Label>Inseam</Label>
                <Input
                  value={measurements.inseam || ""}
                  onChange={(e) =>
                    setMeasurements({ ...measurements, inseam: e.target.value })
                  }
                  placeholder='32"'
                />
              </div>
              <div className="space-y-2">
                <Label>Shoe Size</Label>
                <Input
                  value={measurements.shoeSize || ""}
                  onChange={(e) =>
                    setMeasurements({
                      ...measurements,
                      shoeSize: e.target.value,
                    })
                  }
                  placeholder="10.5"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Subscription
              {subscription?.tier === "pro" && (
                <span className="text-xs font-medium bg-primary text-primary-foreground px-2 py-0.5 rounded">
                  PRO
                </span>
              )}
            </CardTitle>
            <CardDescription>
              Manage your Outfit IQ subscription
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription?.tier === "pro" ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className="font-medium capitalize">{subscription.status}</span>
                  </div>
                  {subscription.endDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {subscription.status === "canceled" ? "Access until" : "Next billing date"}
                      </span>
                      <span className="font-medium">
                        {new Date(subscription.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={async () => {
                    setIsManagingSubscription(true);
                    try {
                      const response = await fetch("/api/stripe/portal", {
                        method: "POST",
                      });
                      const data = await response.json();
                      if (data.url) {
                        window.location.href = data.url;
                      } else {
                        throw new Error("Failed to open portal");
                      }
                    } catch (error) {
                      console.error("Portal error:", error);
                      toast.error("Failed to open subscription management");
                    } finally {
                      setIsManagingSubscription(false);
                    }
                  }}
                  disabled={isManagingSubscription}
                >
                  {isManagingSubscription ? "Loading..." : "Manage Subscription"}
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You&apos;re currently on the Free plan. Upgrade to Pro for unlimited AI chat,
                  shoe care instructions, and an ad-free experience.
                </p>
                <Link href="/pricing">
                  <Button>Upgrade to Pro</Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Setup Wizard</CardTitle>
            <CardDescription>
              Restart the setup wizard to update your interests or see the intro again
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={async () => {
                setIsResetting(true);
                try {
                  await resetOnboarding();
                  router.refresh();
                  toast.success("Setup wizard will appear on next page load");
                } catch (error) {
                  console.error("Reset error:", error);
                  toast.error("Failed to reset wizard");
                } finally {
                  setIsResetting(false);
                }
              }}
              disabled={isResetting}
            >
              {isResetting ? "Resetting..." : "Restart Setup Wizard"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
