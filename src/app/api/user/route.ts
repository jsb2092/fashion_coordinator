import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const itemCount = await prisma.wardrobeItem.count({
    where: { personId: person.id },
  });

  return NextResponse.json({
    id: person.id,
    clerkUserId: userId,
    name: person.name,
    preferences: person.preferences,
    measurements: person.measurements,
    itemCount,
  });
}

export async function PUT(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { preferences, measurements, name } = await request.json();

    const person = await prisma.person.upsert({
      where: { clerkUserId: userId },
      update: {
        ...(preferences !== undefined && { preferences }),
        ...(measurements !== undefined && { measurements }),
        ...(name !== undefined && { name }),
      },
      create: {
        clerkUserId: userId,
        name: name || "User",
        preferences,
        measurements,
      },
    });

    return NextResponse.json({
      id: person.id,
      name: person.name,
      preferences: person.preferences,
      measurements: person.measurements,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}
