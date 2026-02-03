import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getOutfitSuggestion } from "@/lib/claude";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const person = await prisma.person.findUnique({
      where: { clerkUserId: userId },
    });

    if (!person) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { messages } = await request.json();
    const lastUserMessage = messages[messages.length - 1]?.content;

    if (!lastUserMessage) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    const wardrobeItems = await prisma.wardrobeItem.findMany({
      where: {
        personId: person.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        category: true,
        subcategory: true,
        colorPrimary: true,
        colorSecondary: true,
        pattern: true,
        formalityLevel: true,
        seasonSuitability: true,
        lastWorn: true,
        timesWorn: true,
        photoUrls: true,
      },
    });

    if (wardrobeItems.length === 0) {
      return NextResponse.json({
        content:
          "It looks like you haven't added any items to your wardrobe yet. Head over to the Wardrobe section and upload some photos of your clothing, and I'll be able to help you put together outfits!",
      });
    }

    const recentOutfits = await prisma.outfit.findMany({
      where: { personId: person.id },
      include: {
        items: {
          select: {
            wardrobeItemId: true,
          },
        },
      },
      orderBy: { lastWorn: "desc" },
      take: 5,
    });

    const outfitHistory = recentOutfits.map((o) => ({
      id: o.id,
      name: o.name,
      itemIds: o.items.map((i) => i.wardrobeItemId),
      lastWorn: o.lastWorn,
    }));

    const suggestion = await getOutfitSuggestion(
      lastUserMessage,
      wardrobeItems.map((item) => ({
        id: item.id,
        category: item.category,
        subcategory: item.subcategory,
        colorPrimary: item.colorPrimary,
        colorSecondary: item.colorSecondary,
        pattern: item.pattern,
        formalityLevel: item.formalityLevel,
        seasonSuitability: item.seasonSuitability.map((s) => s.toString()),
        lastWorn: item.lastWorn,
        timesWorn: item.timesWorn,
      })),
      person.preferences as Record<string, unknown> | null,
      outfitHistory
    );

    const suggestedItems = wardrobeItems.filter((item) =>
      suggestion.itemIds.includes(item.id)
    );

    let content = suggestion.reasoning;
    if (suggestion.stylingTips) {
      content += `\n\n**Styling tips:** ${suggestion.stylingTips}`;
    }

    return NextResponse.json({
      content,
      suggestedOutfit: {
        name: suggestion.outfitName,
        itemIds: suggestion.itemIds,
        items: suggestedItems.map((item) => ({
          id: item.id,
          category: item.category,
          colorPrimary: item.colorPrimary,
          photoUrls: item.photoUrls,
        })),
        reasoning: suggestion.reasoning,
        occasionType: suggestion.occasionType,
        formalityScore: suggestion.formalityScore,
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      {
        content:
          "I'm having trouble processing your request right now. Please try again in a moment.",
      },
      { status: 500 }
    );
  }
}
