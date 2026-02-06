import Stripe from "stripe";

function createStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) {
    // Return a dummy client that will error when used
    // This allows the app to build without the key
    return null;
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2026-01-28.clover",
    typescript: true,
  });
}

const stripeClient = createStripeClient();

export const stripe = stripeClient as Stripe;

export const PLANS = {
  free: {
    name: "Free",
    price: 0,
    features: [
      "Unlimited wardrobe items",
      "Basic outfit suggestions (manual)",
      "3 shoe care instructions/month",
    ],
    limits: {
      shoeCareInstructions: 3,
      aiChat: false,
      tripPlanning: false,
    },
  },
  pro: {
    name: "Pro",
    monthlyPrice: 8,
    yearlyPrice: 60,
    features: [
      "Everything in Free",
      "No ads",
      "Unlimited AI chat",
      "Unlimited shoe care instructions",
      "Supply tracking",
      "Trip planning & packing lists",
      "Priority features",
    ],
    limits: {
      shoeCareInstructions: Infinity,
      aiChat: true,
      tripPlanning: true,
    },
  },
} as const;

export type SubscriptionTier = keyof typeof PLANS;
