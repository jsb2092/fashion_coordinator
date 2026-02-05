export const SUPPLY_CATEGORIES = [
  { value: "POLISH", label: "Polish" },
  { value: "BRUSH", label: "Brush" },
  { value: "TREE", label: "Shoe Tree" },
  { value: "CLEANER", label: "Cleaner" },
  { value: "PROTECTION", label: "Protection" },
  { value: "CLOTH", label: "Cloth" },
  { value: "TOOL", label: "Tool" },
  { value: "LACES", label: "Laces" },
  { value: "OTHER", label: "Other" },
] as const;

export type SupplyCategoryValue = (typeof SUPPLY_CATEGORIES)[number]["value"];

export const SUPPLY_SUBCATEGORIES: Record<SupplyCategoryValue, string[]> = {
  POLISH: ["Cream polish", "Wax polish", "Liquid polish", "Edge dressing", "Renovateur"],
  BRUSH: ["Horsehair brush", "Dauber brush", "Suede brush", "Shine brush", "Welt brush"],
  TREE: ["Cedar shoe tree", "Plastic shoe tree", "Boot tree", "Travel shoe tree"],
  CLEANER: ["Saddle soap", "Leather cleaner", "Suede cleaner", "Sneaker cleaner"],
  PROTECTION: ["Water repellent", "Leather conditioner", "Suede protector", "Mink oil"],
  CLOTH: ["Polishing cloth", "Microfiber cloth", "Chamois", "Application cloth", "Buffing cloth"],
  TOOL: ["Shoe horn", "Edge burnisher", "Heel grips", "Tongue pads"],
  LACES: ["Dress laces", "Round laces", "Flat laces", "Waxed laces", "Elastic laces"],
  OTHER: ["Storage bag", "Shoe rack", "Boot stand", "Cedar balls"],
};

export const SUPPLY_STATUSES = [
  { value: "IN_STOCK", label: "In Stock" },
  { value: "LOW_STOCK", label: "Low Stock" },
  { value: "OUT_OF_STOCK", label: "Out of Stock" },
  { value: "ORDERED", label: "Ordered" },
  { value: "DISCONTINUED", label: "Discontinued" },
] as const;

export const POLISH_COLORS = [
  "Black",
  "Burgundy",
  "Dark Brown",
  "Medium Brown",
  "Light Brown",
  "Tan",
  "Cognac",
  "Navy",
  "Neutral",
  "Oxblood",
  "Cordovan",
  "Walnut",
  "Mahogany",
  "Other",
] as const;

export const COMPATIBLE_MATERIALS = [
  "Smooth leather",
  "Full-grain leather",
  "Corrected-grain leather",
  "Patent leather",
  "Suede",
  "Nubuck",
  "Shell cordovan",
  "Exotic leather",
  "Canvas",
  "Synthetic",
  "Rubber",
] as const;

export const COMMON_BRANDS = [
  "Allen Edmonds",
  "Angelus",
  "Bickmore",
  "Boot Black",
  "Collonil",
  "Fiebing's",
  "Kiwi",
  "Lincoln",
  "Meltonian",
  "Moneysworth & Best",
  "Saphir",
  "Tarrago",
  "Venetian",
  "Woodlore",
  "Other",
] as const;

export const QUANTITY_UNITS = [
  "each",
  "pair",
  "bottle",
  "jar",
  "can",
  "tube",
  "set",
] as const;
