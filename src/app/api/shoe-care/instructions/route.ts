import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { generateCareInstructions } from "@/lib/claude";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { shoeId, careType = "full_polish" } = body;

    if (!shoeId) {
      return NextResponse.json({ error: "Missing shoeId" }, { status: 400 });
    }

    // Get the person
    const person = await prisma.person.findUnique({
      where: { clerkUserId: userId },
    });

    if (!person) {
      return NextResponse.json({ error: "Person not found" }, { status: 404 });
    }

    // Get the shoe
    const shoe = await prisma.wardrobeItem.findFirst({
      where: {
        id: shoeId,
        personId: person.id,
      },
    });

    if (!shoe) {
      return NextResponse.json({ error: "Shoe not found" }, { status: 404 });
    }

    // Get all their care supplies
    const supplies = await prisma.careSupply.findMany({
      where: {
        personId: person.id,
        status: { in: ["IN_STOCK", "LOW_STOCK"] }, // Only available supplies
      },
    });

    // Generate instructions
    const instructions = await generateCareInstructions(
      {
        category: shoe.category,
        subcategory: shoe.subcategory,
        colorPrimary: shoe.colorPrimary,
        colorSecondary: shoe.colorSecondary,
        material: shoe.material,
        brand: shoe.brand,
      },
      supplies.map((s) => ({
        name: s.name,
        category: s.category,
        subcategory: s.subcategory,
        brand: s.brand,
        color: s.color,
        compatibleColors: s.compatibleColors,
        compatibleMaterials: s.compatibleMaterials,
      })),
      careType
    );

    return NextResponse.json(instructions);
  } catch (error) {
    console.error("Care instructions error:", error);
    return NextResponse.json(
      { error: "Failed to generate care instructions" },
      { status: 500 }
    );
  }
}
