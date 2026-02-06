"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { PLANS, SubscriptionTier } from "./stripe";

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: string;
  endDate: Date | null;
  isActive: boolean;
  canAccessAiChat: boolean;
  canAccessTripPlanning: boolean;
  shoeCareUsageThisMonth: number;
  shoeCareLimit: number;
  canUseShoeCare: boolean;
}

export async function getSubscriptionInfo(): Promise<SubscriptionInfo> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const person = await prisma.person.findUnique({
    where: { clerkUserId: userId },
  });

  if (!person) {
    throw new Error("User not found");
  }

  const tier = (person.subscriptionTier || "free") as SubscriptionTier;
  const plan = PLANS[tier];
  const isActive = tier === "pro" && person.subscriptionStatus === "active";

  // Check if we need to reset monthly usage
  const now = new Date();
  const usageResetDate = person.usageResetDate;
  let shoeCareUsageThisMonth = person.shoeCareUsageThisMonth;

  if (usageResetDate.getMonth() !== now.getMonth() || usageResetDate.getFullYear() !== now.getFullYear()) {
    // Reset usage for new month
    await prisma.person.update({
      where: { id: person.id },
      data: {
        shoeCareUsageThisMonth: 0,
        usageResetDate: now,
      },
    });
    shoeCareUsageThisMonth = 0;
  }

  const shoeCareLimit = plan.limits.shoeCareInstructions;
  const canUseShoeCare = tier === "pro" || shoeCareUsageThisMonth < shoeCareLimit;

  return {
    tier,
    status: person.subscriptionStatus,
    endDate: person.subscriptionEndDate,
    isActive: tier === "pro" && person.subscriptionStatus === "active",
    canAccessAiChat: tier === "pro" && isActive,
    canAccessTripPlanning: tier === "pro" && isActive,
    shoeCareUsageThisMonth,
    shoeCareLimit,
    canUseShoeCare,
  };
}

export async function incrementShoeCareUsage(): Promise<void> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const person = await prisma.person.findUnique({
    where: { clerkUserId: userId },
  });

  if (!person) {
    throw new Error("User not found");
  }

  await prisma.person.update({
    where: { id: person.id },
    data: {
      shoeCareUsageThisMonth: person.shoeCareUsageThisMonth + 1,
    },
  });
}

export async function checkFeatureAccess(feature: "aiChat" | "tripPlanning" | "shoeCare"): Promise<{
  allowed: boolean;
  reason?: string;
  usageInfo?: { used: number; limit: number };
}> {
  const subscription = await getSubscriptionInfo();

  switch (feature) {
    case "aiChat":
      if (!subscription.canAccessAiChat) {
        return {
          allowed: false,
          reason: "AI Chat requires a Pro subscription",
        };
      }
      return { allowed: true };

    case "tripPlanning":
      if (!subscription.canAccessTripPlanning) {
        return {
          allowed: false,
          reason: "Trip Planning requires a Pro subscription",
        };
      }
      return { allowed: true };

    case "shoeCare":
      if (!subscription.canUseShoeCare) {
        return {
          allowed: false,
          reason: `You've used all ${subscription.shoeCareLimit} shoe care instructions this month`,
          usageInfo: {
            used: subscription.shoeCareUsageThisMonth,
            limit: subscription.shoeCareLimit,
          },
        };
      }
      return {
        allowed: true,
        usageInfo: {
          used: subscription.shoeCareUsageThisMonth,
          limit: subscription.shoeCareLimit,
        },
      };

    default:
      return { allowed: true };
  }
}
