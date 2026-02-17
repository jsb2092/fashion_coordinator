import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getOrCreatePerson(userId: string) {
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

  return person;
}

export async function GET(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const person = await getOrCreatePerson(userId);

  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const status = searchParams.get("status");
  const formalityLevel = searchParams.get("formality");
  const season = searchParams.get("season");

  const where: Record<string, unknown> = {
    personId: person.id,
  };

  if (category) {
    where.category = category;
  }

  if (status) {
    where.status = status;
  } else {
    where.status = "ACTIVE";
  }

  if (formalityLevel) {
    where.formalityLevel = parseInt(formalityLevel);
  }

  if (season) {
    where.seasonSuitability = {
      has: season,
    };
  }

  const items = await prisma.wardrobeItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const person = await getOrCreatePerson(userId);

  try {
    const data = await request.json();

    const [item] = await prisma.$transaction([
      prisma.wardrobeItem.create({
        data: {
          personId: person.id,
          photoUrls: data.photoUrls,
          category: data.category,
          subcategory: data.subcategory,
          colorPrimary: data.colorPrimary,
          colorSecondary: data.colorSecondary,
          pattern: data.pattern,
          brand: data.brand,
          material: data.material,
          formalityLevel: data.formalityLevel,
          construction: data.construction,
          seasonSuitability: data.seasonSuitability,
          notes: data.notes,
          aiAnalysis: data.aiAnalysis,
        },
      }),
      prisma.person.update({
        where: { id: person.id },
        data: { wardrobeLastModified: new Date() },
      }),
    ]);

    return NextResponse.json(item);
  } catch (error) {
    console.error("Create item error:", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 }
    );
  }
}
