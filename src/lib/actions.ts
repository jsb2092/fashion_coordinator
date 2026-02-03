"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

export async function getOrCreatePerson() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

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

export async function getWardrobeItems(filters?: {
  category?: string;
  status?: string;
  formalityLevel?: number;
  season?: string;
  search?: string;
}) {
  const person = await getOrCreatePerson();

  const where: Record<string, unknown> = {
    personId: person.id,
  };

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.status) {
    where.status = filters.status;
  } else {
    // Default: show available items (exclude archived, donated, sold)
    where.status = {
      notIn: ["ARCHIVED", "DONATED", "SOLD"],
    };
  }

  if (filters?.formalityLevel) {
    where.formalityLevel = filters.formalityLevel;
  }

  if (filters?.season) {
    where.seasonSuitability = {
      has: filters.season,
    };
  }

  if (filters?.search) {
    where.OR = [
      { category: { contains: filters.search, mode: "insensitive" } },
      { subcategory: { contains: filters.search, mode: "insensitive" } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { colorPrimary: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.wardrobeItem.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
}

export async function getWardrobeItem(id: string) {
  const person = await getOrCreatePerson();

  return prisma.wardrobeItem.findFirst({
    where: {
      id,
      personId: person.id,
    },
  });
}

export async function createWardrobeItem(data: {
  photoUrls: string[];
  category: string;
  subcategory?: string;
  colorPrimary: string;
  colorSecondary?: string;
  pattern?: string;
  brand?: string;
  material?: string;
  formalityLevel: number;
  construction?: string;
  seasonSuitability: string[];
  notes?: string;
  aiAnalysis?: Record<string, unknown>;
}) {
  const person = await getOrCreatePerson();

  const item = await prisma.wardrobeItem.create({
    data: {
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
      notes: data.notes,
      personId: person.id,
      seasonSuitability: data.seasonSuitability as never[],
      aiAnalysis: data.aiAnalysis as never,
    },
  });

  revalidatePath("/");
  return item;
}

export async function updateWardrobeItem(
  id: string,
  data: Partial<{
    photoUrls: string[];
    category: string;
    subcategory: string;
    colorPrimary: string;
    colorSecondary: string;
    pattern: string;
    brand: string;
    material: string;
    formalityLevel: number;
    construction: string;
    seasonSuitability: string[];
    status: string;
    notes: string;
  }>
) {
  const person = await getOrCreatePerson();

  const item = await prisma.wardrobeItem.updateMany({
    where: {
      id,
      personId: person.id,
    },
    data: data as never,
  });

  revalidatePath("/");
  return item;
}

export async function deleteWardrobeItem(id: string) {
  const person = await getOrCreatePerson();

  await prisma.wardrobeItem.deleteMany({
    where: {
      id,
      personId: person.id,
    },
  });

  revalidatePath("/");
}

export async function getOutfits() {
  const person = await getOrCreatePerson();

  return prisma.outfit.findMany({
    where: { personId: person.id },
    include: {
      items: {
        include: {
          wardrobeItem: true,
        },
        orderBy: { position: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createOutfit(data: {
  name: string;
  occasionType: string;
  description?: string;
  itemIds: string[];
  formalityScore?: number;
  seasons?: string[];
  createdBy?: string;
  aiReasoning?: string;
}) {
  const person = await getOrCreatePerson();

  const outfit = await prisma.outfit.create({
    data: {
      personId: person.id,
      name: data.name,
      occasionType: data.occasionType as never,
      description: data.description,
      formalityScore: data.formalityScore,
      seasons: (data.seasons || ["ALL_SEASON"]) as never[],
      createdBy: data.createdBy || "manual",
      aiReasoning: data.aiReasoning,
      items: {
        create: data.itemIds.map((itemId, index) => ({
          wardrobeItemId: itemId,
          position: index,
        })),
      },
    },
    include: {
      items: {
        include: {
          wardrobeItem: true,
        },
      },
    },
  });

  revalidatePath("/outfits");
  return outfit;
}

export async function deleteOutfit(id: string) {
  const person = await getOrCreatePerson();

  await prisma.outfit.deleteMany({
    where: {
      id,
      personId: person.id,
    },
  });

  revalidatePath("/outfits");
}

export async function updateOutfit(
  id: string,
  data: {
    name?: string;
    occasionType?: string;
    description?: string;
    itemIds?: string[];
  }
) {
  const person = await getOrCreatePerson();

  // Verify ownership
  const existing = await prisma.outfit.findFirst({
    where: { id, personId: person.id },
  });

  if (!existing) {
    throw new Error("Outfit not found");
  }

  // If itemIds are provided, update the outfit items
  if (data.itemIds) {
    // Delete existing outfit items
    await prisma.outfitItem.deleteMany({
      where: { outfitId: id },
    });

    // Create new outfit items
    await prisma.outfitItem.createMany({
      data: data.itemIds.map((itemId, index) => ({
        outfitId: id,
        wardrobeItemId: itemId,
        position: index,
      })),
    });
  }

  // Update outfit metadata
  const outfit = await prisma.outfit.update({
    where: { id },
    data: {
      ...(data.name && { name: data.name }),
      ...(data.occasionType && { occasionType: data.occasionType as never }),
      ...(data.description !== undefined && { description: data.description }),
    },
    include: {
      items: {
        include: { wardrobeItem: true },
        orderBy: { position: "asc" },
      },
    },
  });

  revalidatePath("/outfits");
  return outfit;
}
