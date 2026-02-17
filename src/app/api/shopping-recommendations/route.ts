import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateShoppingRecommendations } from "@/lib/claude";

const ONE_HOUR_MS = 60 * 60 * 1000;
const MIN_ITEMS = 3;

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
      // Cache valid: wardrobe hasn't changed since cache was built
      if (cached.wardrobeModifiedAt >= person.wardrobeLastModified) {
        return NextResponse.json({
          recommendations: cached.recommendations,
        });
      }

      // Throttle: don't regenerate if cache was updated less than 1 hour ago
      const cacheAge = Date.now() - cached.updatedAt.getTime();
      if (cacheAge < ONE_HOUR_MS) {
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

    // Upsert cache
    await prisma.shoppingRecommendationCache.upsert({
      where: { personId: person.id },
      update: {
        recommendations: recommendations as object[],
        wardrobeModifiedAt: person.wardrobeLastModified,
        itemCount,
      },
      create: {
        personId: person.id,
        recommendations: recommendations as object[],
        wardrobeModifiedAt: person.wardrobeLastModified,
        itemCount,
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
