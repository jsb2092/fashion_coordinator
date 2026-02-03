import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Season } from "@prisma/client";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let person = await prisma.person.findUnique({
      where: { clerkUserId: userId },
    });

    if (!person) {
      person = await prisma.person.create({
        data: {
          clerkUserId: userId,
          name: "User",
        },
      });
    }

    const { items } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided" },
        { status: 400 }
      );
    }

    const created = await prisma.wardrobeItem.createMany({
      data: items.map((item: {
        category: string;
        subcategory?: string;
        colorPrimary: string;
        colorSecondary?: string;
        pattern?: string;
        brand?: string;
        material?: string;
        formalityLevel: number;
        construction?: string;
        seasonSuitability?: string[];
        notes?: string;
      }) => ({
        personId: person.id,
        photoUrls: [],
        category: item.category,
        subcategory: item.subcategory || null,
        colorPrimary: item.colorPrimary,
        colorSecondary: item.colorSecondary || null,
        pattern: item.pattern || "Solid",
        brand: item.brand || null,
        material: item.material || null,
        formalityLevel: item.formalityLevel,
        construction: item.construction || null,
        seasonSuitability: (item.seasonSuitability || ["ALL_SEASON"]) as Season[],
        notes: item.notes || null,
      })),
    });

    revalidatePath("/");
    return NextResponse.json({ count: created.count });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "Failed to import items" },
      { status: 500 }
    );
  }
}
