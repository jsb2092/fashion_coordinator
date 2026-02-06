import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";

interface SubscriptionWithPeriod extends Stripe.Subscription {
  current_period_end: number;
}

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json(
      { error: "Stripe is not configured" },
      { status: 503 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error("Missing STRIPE_WEBHOOK_SECRET");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as SubscriptionWithPeriod;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as SubscriptionWithPeriod;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === "string"
            ? invoice.subscription
            : invoice.subscription.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId) as unknown as SubscriptionWithPeriod;
          await handleSubscriptionUpdate(subscription);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription?: string | Stripe.Subscription };
        if (invoice.subscription) {
          await handlePaymentFailed(invoice);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook handler error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

async function handleSubscriptionUpdate(subscription: SubscriptionWithPeriod) {
  const customerId = subscription.customer as string;

  const person = await prisma.person.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!person) {
    // Try to find by metadata
    const personId = subscription.metadata?.personId;
    if (personId) {
      await prisma.person.update({
        where: { id: personId },
        data: {
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscription.id,
          subscriptionTier: "pro",
          subscriptionStatus: subscription.status,
          subscriptionEndDate: new Date(subscription.current_period_end * 1000),
        },
      });
    }
    return;
  }

  await prisma.person.update({
    where: { id: person.id },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionTier: subscription.status === "active" ? "pro" : person.subscriptionTier,
      subscriptionStatus: subscription.status,
      subscriptionEndDate: new Date(subscription.current_period_end * 1000),
    },
  });
}

async function handleSubscriptionDeleted(subscription: SubscriptionWithPeriod) {
  const customerId = subscription.customer as string;

  const person = await prisma.person.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!person) return;

  // Check if subscription end date is in the future (canceled but not yet expired)
  const endDate = new Date(subscription.current_period_end * 1000);
  const now = new Date();

  if (endDate > now) {
    // Subscription canceled but access continues until end date
    await prisma.person.update({
      where: { id: person.id },
      data: {
        subscriptionStatus: "canceled",
        subscriptionEndDate: endDate,
      },
    });
  } else {
    // Subscription fully expired, revert to free
    await prisma.person.update({
      where: { id: person.id },
      data: {
        subscriptionTier: "free",
        subscriptionStatus: "inactive",
        stripeSubscriptionId: null,
        subscriptionEndDate: null,
      },
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  const person = await prisma.person.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!person) return;

  await prisma.person.update({
    where: { id: person.id },
    data: {
      subscriptionStatus: "past_due",
    },
  });
}
