"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "./prisma";
import { revalidatePath } from "next/cache";

export async function getOrCreatePerson() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  // Get user details from Clerk
  const clerkUser = await currentUser();
  const name = clerkUser?.firstName
    ? `${clerkUser.firstName}${clerkUser.lastName ? ` ${clerkUser.lastName}` : ""}`
    : "User";
  const email = clerkUser?.primaryEmailAddress?.emailAddress || null;

  // Use upsert to avoid race conditions when multiple requests
  // come in simultaneously for a new user
  const person = await prisma.person.upsert({
    where: { clerkUserId: userId },
    update: {
      // Update name/email if they were missing or changed
      name,
      email,
    },
    create: {
      clerkUserId: userId,
      name,
      email,
    },
  });

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
    name: string | null;
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

// Chat Session Actions
export async function getChatSessions() {
  const person = await getOrCreatePerson();

  return prisma.chatSession.findMany({
    where: { personId: person.id },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        take: 1,
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function getChatSession(id: string) {
  const person = await getOrCreatePerson();

  return prisma.chatSession.findFirst({
    where: { id, personId: person.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function createChatSession(title?: string) {
  const person = await getOrCreatePerson();

  const session = await prisma.chatSession.create({
    data: {
      personId: person.id,
      title: title || "New Chat",
    },
  });

  revalidatePath("/chat");
  return session;
}

export async function addChatMessage(
  sessionId: string,
  role: string,
  content: string,
  suggestedOutfit?: {
    name: string;
    itemIds: string[];
    reasoning: string;
    occasionType: string;
    formalityScore: number;
    items?: unknown[];
  }
) {
  const person = await getOrCreatePerson();

  // Verify ownership
  const session = await prisma.chatSession.findFirst({
    where: { id: sessionId, personId: person.id },
  });

  if (!session) {
    throw new Error("Chat session not found");
  }

  const message = await prisma.chatMessage.create({
    data: {
      sessionId,
      role,
      content,
      suggestedOutfitIds: suggestedOutfit?.itemIds || [],
      suggestedOutfit: suggestedOutfit ? (suggestedOutfit as never) : undefined,
    },
  });

  // Update session title from first user message if untitled
  if (role === "user" && session.title === "New Chat") {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        title: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  }

  revalidatePath("/chat");
  return message;
}

export async function deleteChatSession(id: string) {
  const person = await getOrCreatePerson();

  await prisma.chatSession.deleteMany({
    where: { id, personId: person.id },
  });

  revalidatePath("/chat");
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

// Care Supply Actions
export async function getCareSupplies(filters?: {
  category?: string;
  status?: string;
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
  }

  if (filters?.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { brand: { contains: filters.search, mode: "insensitive" } },
      { subcategory: { contains: filters.search, mode: "insensitive" } },
      { notes: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  return prisma.careSupply.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      shoeLinks: {
        include: {
          wardrobeItem: true,
        },
      },
      parentKit: true,
      kitItems: true,
    },
  });
}

export async function getCareSupply(id: string) {
  const person = await getOrCreatePerson();

  return prisma.careSupply.findFirst({
    where: {
      id,
      personId: person.id,
    },
    include: {
      shoeLinks: {
        include: {
          wardrobeItem: true,
        },
      },
      parentKit: true,
      kitItems: true,
    },
  });
}

export async function createCareSupply(data: {
  photoUrls?: string[];
  name: string;
  category: string;
  subcategory?: string;
  brand?: string;
  color?: string;
  size?: string;
  compatibleColors?: string[];
  compatibleMaterials?: string[];
  status?: string;
  quantity?: number;
  quantityUnit?: string;
  reorderThreshold?: number;
  purchaseDate?: Date;
  purchasePrice?: number;
  purchaseSource?: string;
  reorderUrl?: string;
  rating?: number;
  notes?: string;
  parentKitId?: string;
}) {
  const person = await getOrCreatePerson();

  const [supply] = await prisma.$transaction([
    prisma.careSupply.create({
      data: {
        personId: person.id,
        photoUrls: data.photoUrls || [],
        name: data.name,
        category: data.category as never,
        subcategory: data.subcategory,
        brand: data.brand,
        color: data.color,
        size: data.size,
        compatibleColors: data.compatibleColors || [],
        compatibleMaterials: data.compatibleMaterials || [],
        status: (data.status as never) || "IN_STOCK",
        quantity: data.quantity || 1,
        quantityUnit: data.quantityUnit,
        reorderThreshold: data.reorderThreshold,
        purchaseDate: data.purchaseDate,
        purchasePrice: data.purchasePrice,
        purchaseSource: data.purchaseSource,
        reorderUrl: data.reorderUrl,
        rating: data.rating,
        notes: data.notes,
        parentKitId: data.parentKitId,
      },
    }),
    // Update suppliesLastModified for cache invalidation
    prisma.person.update({
      where: { id: person.id },
      data: { suppliesLastModified: new Date() },
    }),
  ]);

  revalidatePath("/shoe-care");
  return supply;
}

export async function updateCareSupply(
  id: string,
  data: Partial<{
    photoUrls: string[];
    name: string;
    category: string;
    subcategory: string;
    brand: string;
    color: string;
    size: string;
    compatibleColors: string[];
    compatibleMaterials: string[];
    status: string;
    quantity: number;
    quantityUnit: string;
    reorderThreshold: number;
    purchaseDate: Date;
    purchasePrice: number;
    purchaseSource: string;
    reorderUrl: string;
    rating: number;
    notes: string;
  }>
) {
  const person = await getOrCreatePerson();

  await prisma.$transaction([
    prisma.careSupply.updateMany({
      where: {
        id,
        personId: person.id,
      },
      data: data as never,
    }),
    // Update suppliesLastModified for cache invalidation
    prisma.person.update({
      where: { id: person.id },
      data: { suppliesLastModified: new Date() },
    }),
  ]);

  revalidatePath("/shoe-care");
}

export async function deleteCareSupply(id: string) {
  const person = await getOrCreatePerson();

  await prisma.$transaction([
    prisma.careSupply.deleteMany({
      where: {
        id,
        personId: person.id,
      },
    }),
    // Update suppliesLastModified for cache invalidation
    prisma.person.update({
      where: { id: person.id },
      data: { suppliesLastModified: new Date() },
    }),
  ]);

  revalidatePath("/shoe-care");
}

export async function recordSupplyUsage(id: string) {
  const person = await getOrCreatePerson();

  const supply = await prisma.careSupply.findFirst({
    where: { id, personId: person.id },
  });

  if (!supply) {
    throw new Error("Supply not found");
  }

  await prisma.careSupply.update({
    where: { id },
    data: {
      timesUsed: supply.timesUsed + 1,
      lastUsed: new Date(),
    },
  });

  revalidatePath("/shoe-care");
}

export async function linkSupplyToShoe(
  supplyId: string,
  shoeId: string,
  options?: { isPrimary?: boolean; notes?: string }
) {
  const person = await getOrCreatePerson();

  // Verify ownership of both items
  const supply = await prisma.careSupply.findFirst({
    where: { id: supplyId, personId: person.id },
  });
  const shoe = await prisma.wardrobeItem.findFirst({
    where: { id: shoeId, personId: person.id },
  });

  if (!supply || !shoe) {
    throw new Error("Supply or shoe not found");
  }

  const link = await prisma.shoeSupplyLink.upsert({
    where: {
      careSupplyId_wardrobeItemId: {
        careSupplyId: supplyId,
        wardrobeItemId: shoeId,
      },
    },
    create: {
      careSupplyId: supplyId,
      wardrobeItemId: shoeId,
      isPrimary: options?.isPrimary || false,
      notes: options?.notes,
    },
    update: {
      isPrimary: options?.isPrimary,
      notes: options?.notes,
    },
  });

  revalidatePath("/shoe-care");
  return link;
}

export async function unlinkSupplyFromShoe(supplyId: string, shoeId: string) {
  const person = await getOrCreatePerson();

  // Verify ownership
  const supply = await prisma.careSupply.findFirst({
    where: { id: supplyId, personId: person.id },
  });

  if (!supply) {
    throw new Error("Supply not found");
  }

  await prisma.shoeSupplyLink.delete({
    where: {
      careSupplyId_wardrobeItemId: {
        careSupplyId: supplyId,
        wardrobeItemId: shoeId,
      },
    },
  });

  revalidatePath("/shoe-care");
}

export async function getCompatibleSuppliesForShoe(shoeId: string) {
  const person = await getOrCreatePerson();

  const shoe = await prisma.wardrobeItem.findFirst({
    where: { id: shoeId, personId: person.id },
  });

  if (!shoe) {
    throw new Error("Shoe not found");
  }

  // Get supplies that are compatible with this shoe's color or material
  const supplies = await prisma.careSupply.findMany({
    where: {
      personId: person.id,
      OR: [
        { compatibleColors: { has: shoe.colorPrimary } },
        shoe.material ? { compatibleMaterials: { has: shoe.material } } : {},
        // Also include supplies already linked to this shoe
        { shoeLinks: { some: { wardrobeItemId: shoeId } } },
      ],
    },
    include: {
      shoeLinks: {
        where: { wardrobeItemId: shoeId },
      },
    },
  });

  return supplies;
}

export async function getShoes() {
  const person = await getOrCreatePerson();

  return prisma.wardrobeItem.findMany({
    where: {
      personId: person.id,
      category: {
        in: ["Dress Shoes", "Casual Shoes", "Boots", "Athletic Shoes", "Formal Shoes"],
      },
      status: {
        notIn: ["ARCHIVED", "DONATED", "SOLD"],
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
