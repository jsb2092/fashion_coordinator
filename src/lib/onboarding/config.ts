export const INTERESTS = [
  {
    id: "shoe_care",
    label: "Shoe care and maintenance",
    description: "Track polishes, brushes, and get care instructions",
  },
  {
    id: "outfit_building",
    label: "Building better outfits",
    description: "Get AI suggestions and save winning combinations",
  },
  {
    id: "busy_professional",
    label: "Quick outfit decisions for work",
    description: "Fast morning decisions and occasion-appropriate looks",
  },
  {
    id: "travel",
    label: "Trip packing and travel",
    description: "Smart packing lists and capsule wardrobes",
  },
  {
    id: "general",
    label: "General wardrobe organization",
    description: "Catalog and organize everything you own",
  },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export const INTEREST_FEATURES: Record<
  InterestId,
  { title: string; description: string }[]
> = {
  shoe_care: [
    {
      title: "Track Your Supplies",
      description: "Keep inventory of polishes, brushes, and shoe trees",
    },
    {
      title: "AI Care Instructions",
      description: "Get step-by-step polish and cleaning guides",
    },
    {
      title: "Know What You Need",
      description: "See what supplies are low or missing",
    },
  ],
  outfit_building: [
    {
      title: "AI Outfit Suggestions",
      description: "Ask Claude for outfit ideas from your wardrobe",
    },
    {
      title: "Occasion Matching",
      description: "Find the right look for any event",
    },
    {
      title: "Save Favorites",
      description: "Remember combinations that work",
    },
  ],
  busy_professional: [
    {
      title: "Quick Suggestions",
      description: "Get outfit ideas in seconds",
    },
    {
      title: "Work-Ready Looks",
      description: "Filter by formality and occasion",
    },
    {
      title: "Weather-Aware",
      description: "Dress appropriately for the day",
    },
  ],
  travel: [
    {
      title: "Smart Packing Lists",
      description: "AI-curated lists for your trips",
    },
    {
      title: "Capsule Wardrobes",
      description: "Maximize outfits with minimal items",
    },
    {
      title: "Trip Planning",
      description: "Plan outfits for each day and occasion",
    },
  ],
  general: [
    {
      title: "AI Cataloging",
      description: "Upload a photo, get instant details",
    },
    {
      title: "Organized Wardrobe",
      description: "Filter by category, color, season",
    },
    {
      title: "Track Everything",
      description: "Know what you own and what you wear",
    },
  ],
};

export const INTEREST_FIRST_ITEM: Record<
  InterestId,
  { suggestion: string; category?: string }
> = {
  shoe_care: {
    suggestion: "Start with your favorite pair of dress shoes",
    category: "Shoes",
  },
  outfit_building: {
    suggestion: "Start with a versatile piece like a blazer or nice shirt",
  },
  busy_professional: {
    suggestion: "Start with something you wear to work often",
  },
  travel: {
    suggestion: "Start with a travel-friendly item you pack frequently",
  },
  general: {
    suggestion: "Start with any item from your closet",
  },
};

export const INTEREST_COMPLETION_CTA: Record<
  InterestId,
  { text: string; href: string }
> = {
  shoe_care: { text: "Add Shoe Care Supplies", href: "/shoe-care/add" },
  outfit_building: { text: "Add More Items", href: "/wardrobe/upload" },
  busy_professional: { text: "Try Ask Claude", href: "/chat" },
  travel: { text: "Plan a Trip", href: "/trips" },
  general: { text: "Explore Your Wardrobe", href: "/" },
};

export const PHOTO_SOURCE_TIPS = [
  {
    icon: "shopping-bag",
    title: "Order History",
    description: "Check Zappos, Amazon, or Nordstrom for product photos",
  },
  {
    icon: "camera",
    title: "Your Photos",
    description: "Scroll through your camera roll - you might have photos already",
  },
  {
    icon: "screenshot",
    title: "Product Pages",
    description: "Screenshot the product image from the brand's website",
  },
  {
    icon: "hanger",
    title: "Quick Snap",
    description: "Lay flat or hang for a clear photo",
  },
] as const;

export const STYLE_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "smart_casual", label: "Smart Casual" },
  { value: "business", label: "Business" },
  { value: "varied", label: "Varied / All of the above" },
] as const;
