import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Season } from "@prisma/client";

const DEMO_EMAIL = "demo@outfit-iq.com";
const DEMO_PASSWORD = "DemoAccount123!";

const DEMO_ITEMS: Array<{
  name: string;
  category: string;
  subcategory: string;
  colorPrimary: string;
  pattern: string;
  brand: string;
  material: string;
  formalityLevel: number;
  seasonSuitability: Season[];
  photoUrls: string[];
}> = [
  // Tops
  {
    name: "White Oxford Shirt",
    category: "Tops",
    subcategory: "Dress Shirt",
    colorPrimary: "White",
    pattern: "Solid",
    brand: "Brooks Brothers",
    material: "Cotton",
    formalityLevel: 4,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800"],
  },
  {
    name: "Light Blue Dress Shirt",
    category: "Tops",
    subcategory: "Dress Shirt",
    colorPrimary: "Light Blue",
    pattern: "Solid",
    brand: "Charles Tyrwhitt",
    material: "Cotton",
    formalityLevel: 4,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=800"],
  },
  {
    name: "Navy Polo",
    category: "Tops",
    subcategory: "Polo",
    colorPrimary: "Navy",
    pattern: "Solid",
    brand: "Ralph Lauren",
    material: "Cotton Pique",
    formalityLevel: 3,
    seasonSuitability: ["SPRING", "SUMMER", "FALL"],
    photoUrls: ["https://images.unsplash.com/photo-1625910513413-5fc45a826e5c?w=800"],
  },
  {
    name: "Gray Crewneck Sweater",
    category: "Tops",
    subcategory: "Sweater",
    colorPrimary: "Gray",
    pattern: "Solid",
    brand: "J.Crew",
    material: "Merino Wool",
    formalityLevel: 3,
    seasonSuitability: ["FALL", "WINTER"],
    photoUrls: ["https://images.unsplash.com/photo-1614975059251-992f11792b9f?w=800"],
  },
  {
    name: "White T-Shirt",
    category: "Tops",
    subcategory: "T-Shirt",
    colorPrimary: "White",
    pattern: "Solid",
    brand: "Uniqlo",
    material: "Cotton",
    formalityLevel: 1,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800"],
  },
  // Bottoms
  {
    name: "Charcoal Dress Pants",
    category: "Bottoms",
    subcategory: "Dress Pants",
    colorPrimary: "Charcoal",
    pattern: "Solid",
    brand: "Hugo Boss",
    material: "Wool Blend",
    formalityLevel: 4,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800"],
  },
  {
    name: "Navy Chinos",
    category: "Bottoms",
    subcategory: "Chinos",
    colorPrimary: "Navy",
    pattern: "Solid",
    brand: "Bonobos",
    material: "Cotton Twill",
    formalityLevel: 3,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800"],
  },
  {
    name: "Tan Chinos",
    category: "Bottoms",
    subcategory: "Chinos",
    colorPrimary: "Tan",
    pattern: "Solid",
    brand: "Dockers",
    material: "Cotton",
    formalityLevel: 3,
    seasonSuitability: ["SPRING", "SUMMER", "FALL"],
    photoUrls: ["https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800"],
  },
  {
    name: "Dark Indigo Jeans",
    category: "Bottoms",
    subcategory: "Jeans",
    colorPrimary: "Indigo",
    pattern: "Solid",
    brand: "Levi's",
    material: "Denim",
    formalityLevel: 2,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1542272604-787c3835535d?w=800"],
  },
  // Outerwear
  {
    name: "Navy Blazer",
    category: "Outerwear",
    subcategory: "Blazer",
    colorPrimary: "Navy",
    pattern: "Solid",
    brand: "Suit Supply",
    material: "Wool",
    formalityLevel: 4,
    seasonSuitability: ["SPRING", "FALL", "WINTER"],
    photoUrls: ["https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800"],
  },
  {
    name: "Camel Overcoat",
    category: "Outerwear",
    subcategory: "Overcoat",
    colorPrimary: "Camel",
    pattern: "Solid",
    brand: "Reiss",
    material: "Wool Cashmere",
    formalityLevel: 4,
    seasonSuitability: ["FALL", "WINTER"],
    photoUrls: ["https://images.unsplash.com/photo-1544923246-77307dd628b7?w=800"],
  },
  {
    name: "Olive Field Jacket",
    category: "Outerwear",
    subcategory: "Jacket",
    colorPrimary: "Olive",
    pattern: "Solid",
    brand: "Barbour",
    material: "Cotton",
    formalityLevel: 2,
    seasonSuitability: ["SPRING", "FALL"],
    photoUrls: ["https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800"],
  },
  // Shoes
  {
    name: "Brown Oxford Brogues",
    category: "Shoes",
    subcategory: "Oxford",
    colorPrimary: "Brown",
    pattern: "Brogue",
    brand: "Allen Edmonds",
    material: "Leather",
    formalityLevel: 4,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800"],
  },
  {
    name: "Black Chelsea Boots",
    category: "Shoes",
    subcategory: "Chelsea Boot",
    colorPrimary: "Black",
    pattern: "Solid",
    brand: "R.M. Williams",
    material: "Leather",
    formalityLevel: 3,
    seasonSuitability: ["FALL", "WINTER"],
    photoUrls: ["https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=800"],
  },
  {
    name: "White Leather Sneakers",
    category: "Shoes",
    subcategory: "Sneakers",
    colorPrimary: "White",
    pattern: "Solid",
    brand: "Common Projects",
    material: "Leather",
    formalityLevel: 2,
    seasonSuitability: ["SPRING", "SUMMER", "FALL"],
    photoUrls: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800"],
  },
  {
    name: "Brown Loafers",
    category: "Shoes",
    subcategory: "Loafer",
    colorPrimary: "Brown",
    pattern: "Solid",
    brand: "Alden",
    material: "Leather",
    formalityLevel: 3,
    seasonSuitability: ["SPRING", "SUMMER", "FALL"],
    photoUrls: ["https://images.unsplash.com/photo-1582897085656-c636d006a246?w=800"],
  },
  // Accessories
  {
    name: "Navy Silk Tie",
    category: "Accessories",
    subcategory: "Tie",
    colorPrimary: "Navy",
    pattern: "Solid",
    brand: "Drake's",
    material: "Silk",
    formalityLevel: 5,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1589756823695-278bc923f962?w=800"],
  },
  {
    name: "Brown Leather Belt",
    category: "Accessories",
    subcategory: "Belt",
    colorPrimary: "Brown",
    pattern: "Solid",
    brand: "Trafalgar",
    material: "Leather",
    formalityLevel: 3,
    seasonSuitability: ["ALL_SEASON"],
    photoUrls: ["https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800"],
  },
];

export async function seedDemoAccount() {
  console.log("[Demo Seed] Starting demo account setup...");

  const clerk = await clerkClient();

  // Check if demo user already exists in Clerk
  const existingUsers = await clerk.users.getUserList({
    emailAddress: [DEMO_EMAIL],
  });

  let clerkUserId: string;

  if (existingUsers.data.length > 0) {
    clerkUserId = existingUsers.data[0].id;
    console.log("[Demo Seed] Demo user already exists in Clerk:", clerkUserId);
  } else {
    // Create demo user in Clerk
    const newUser = await clerk.users.createUser({
      emailAddress: [DEMO_EMAIL],
      password: DEMO_PASSWORD,
      firstName: "Demo",
      lastName: "User",
    });
    clerkUserId = newUser.id;
    console.log("[Demo Seed] Created demo user in Clerk:", clerkUserId);
  }

  // Check if Person record exists
  let person = await prisma.person.findUnique({
    where: { clerkUserId },
  });

  if (!person) {
    person = await prisma.person.create({
      data: {
        clerkUserId,
        name: "Demo User",
        email: DEMO_EMAIL,
        hasCompletedOnboarding: true,
      },
    });
    console.log("[Demo Seed] Created Person record:", person.id);
  } else {
    console.log("[Demo Seed] Person record already exists:", person.id);
  }

  // Check if wardrobe items exist
  const existingItems = await prisma.wardrobeItem.count({
    where: { personId: person.id },
  });

  if (existingItems === 0) {
    // Create demo wardrobe items
    const created = await prisma.wardrobeItem.createMany({
      data: DEMO_ITEMS.map((item) => ({
        personId: person.id,
        name: item.name,
        category: item.category,
        subcategory: item.subcategory,
        colorPrimary: item.colorPrimary,
        pattern: item.pattern,
        brand: item.brand,
        material: item.material,
        formalityLevel: item.formalityLevel,
        seasonSuitability: item.seasonSuitability,
        photoUrls: item.photoUrls,
        status: "ACTIVE",
      })),
    });
    console.log("[Demo Seed] Created", created.count, "wardrobe items");
  } else {
    console.log("[Demo Seed] Wardrobe items already exist:", existingItems);
  }

  console.log("[Demo Seed] Demo account setup complete!");
  console.log("[Demo Seed] Login with:", DEMO_EMAIL, "/", DEMO_PASSWORD);
}
