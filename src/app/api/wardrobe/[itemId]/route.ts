import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

async function getPersonId(userId: string) {
  const person = await prisma.person.findUnique({
    where: { clerkUserId: userId },
  });
  return person?.id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const personId = await getPersonId(userId);
  if (!personId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { itemId } = await params;

  const item = await prisma.wardrobeItem.findFirst({
    where: {
      id: itemId,
      personId,
    },
  });

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const personId = await getPersonId(userId);
  if (!personId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { itemId } = await params;

  try {
    const data = await request.json();

    const item = await prisma.wardrobeItem.updateMany({
      where: {
        id: itemId,
        personId,
      },
      data,
    });

    if (item.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const updated = await prisma.wardrobeItem.findUnique({
      where: { id: itemId },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update item error:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ itemId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const personId = await getPersonId(userId);
  if (!personId) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const { itemId } = await params;

  try {
    const item = await prisma.wardrobeItem.deleteMany({
      where: {
        id: itemId,
        personId,
      },
    });

    if (item.count === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete item error:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
