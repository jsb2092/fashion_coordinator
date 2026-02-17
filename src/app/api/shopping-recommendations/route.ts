import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateShoppingRecommendations } from "@/lib/claude";

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_ITEMS = 2;

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const person = await prisma.person.findUnique({
      where: { clerkUserId: userId },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Pro users don't see recommendations
    if (person.subscriptionTier === "pro") {
      return NextResponse.json({ recommendations: [] });
    }

    // Check cache
    const cached = await prisma.shoppingRecommendationCache.findUnique({
      where: { personId: person.id },
    });

    if (cached) {
      const cacheAge = Date.now() - cached.updatedAt.getTime();
      const recCount = Array.isArray(cached.recommendations)
        ? (cached.recommendations as unknown[]).length
        : 0;
      const allClicked = recCount > 0 && cached.clickCount >= recCount;

      // Wardrobe unchanged + not all clicked through → return cache
      if (
        cached.wardrobeModifiedAt >= person.wardrobeLastModified &&
        !allClicked
      ) {
        return NextResponse.json({
          recommendations: cached.recommendations,
        });
      }

      // Throttle: don't regenerate within 1 week unless all clicked
      if (cacheAge < ONE_WEEK_MS && !allClicked) {
        return NextResponse.json({
          recommendations: cached.recommendations,
        });
      }

      // If all clicked but less than 1 day old, still throttle
      // (prevent rapid regeneration from click-spamming)
      if (allClicked && cacheAge < 24 * 60 * 60 * 1000) {
        return NextResponse.json({
          recommendations: cached.recommendations,
        });
      }
    }

    // Count active wardrobe items
    const itemCount = await prisma.wardrobeItem.count({
      where: {
        personId: person.id,
        status: { notIn: ["ARCHIVED", "DONATED", "SOLD"] },
      },
    });

    if (itemCount < MIN_ITEMS) {
      return NextResponse.json({ recommendations: [] });
    }

    // Fetch wardrobe items for Claude
    const wardrobeItems = await prisma.wardrobeItem.findMany({
      where: {
        personId: person.id,
        status: { notIn: ["ARCHIVED", "DONATED", "SOLD"] },
      },
      select: {
        id: true,
        name: true,
        category: true,
        subcategory: true,
        colorPrimary: true,
        colorSecondary: true,
        pattern: true,
        brand: true,
        material: true,
        formalityLevel: true,
        seasonSuitability: true,
        lastWorn: true,
        timesWorn: true,
      },
    });

    const recommendations = await generateShoppingRecommendations(wardrobeItems);

    // Upsert cache (reset clickCount for fresh recommendations)
    await prisma.shoppingRecommendationCache.upsert({
      where: { personId: person.id },
      update: {
        recommendations: recommendations as object[],
        wardrobeModifiedAt: person.wardrobeLastModified,
        itemCount,
        clickCount: 0,
      },
      create: {
        personId: person.id,
        recommendations: recommendations as object[],
        wardrobeModifiedAt: person.wardrobeLastModified,
        itemCount,
        clickCount: 0,
      },
    });

    return NextResponse.json({ recommendations });
  } catch (error) {
    console.error("Shopping recommendations error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
