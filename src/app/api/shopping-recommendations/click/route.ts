import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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

    const cached = await prisma.shoppingRecommendationCache.findUnique({
      where: { personId: person.id },
    });

    if (cached) {
      await prisma.shoppingRecommendationCache.update({
        where: { personId: person.id },
        data: { clickCount: cached.clickCount + 1 },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Click tracking error:", error);
    return NextResponse.json({ ok: true }); // Don't fail the user experience
  }
}
