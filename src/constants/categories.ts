export const CATEGORIES = [
  "Suits",
  "Structured Blazers/Jackets",
  "Casual Jackets",
  "Dress Shirts",
  "Casual Long-Sleeve Shirts",
  "Short-Sleeve Button-Ups",
  "Polos",
  "T-Shirts",
  "Sweaters/Knits",
  "Dress Pants",
  "Chinos",
  "Jeans",
  "Shorts",
  "Dress Shoes",
  "Casual Shoes",
  "Boots",
  "Athletic Shoes",
  "Formal Shoes",
  "Outerwear",
  "Accessories",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const SUBCATEGORIES: Record<Category, string[]> = {
  Suits: ["2-piece", "3-piece", "Tuxedo"],
  "Structured Blazers/Jackets": ["Sport coat", "Blazer", "Suit jacket (separate)"],
  "Casual Jackets": ["Knit blazer", "Unstructured sport coat", "Bomber", "Field jacket"],
  "Dress Shirts": ["Spread collar", "Semi-spread collar", "Point collar"],
  "Casual Long-Sleeve Shirts": ["Button-down collar", "Flannel", "Chambray", "Solid", "Print"],
  "Short-Sleeve Button-Ups": ["Camp collar", "Standard collar", "Spread collar"],
  Polos: ["Performance", "Pique", "Knit"],
  "T-Shirts": ["Crew neck", "V-neck", "Henley"],
  "Sweaters/Knits": ["Quarter-zip", "V-neck", "Crew neck", "Cardigan", "Cable-knit"],
  "Dress Pants": ["Flat-front", "Pleated"],
  Chinos: ["Standard", "Slim", "Stretch"],
  Jeans: ["Dark wash", "Medium wash", "Light wash"],
  Shorts: ["Chino", "Athletic", "Cargo"],
  "Dress Shoes": ["Oxford", "Derby", "Monk strap", "Loafer"],
  "Casual Shoes": ["Sneakers", "Canvas", "Boat shoes"],
  Boots: ["Chukka", "Chelsea", "Waterproof", "Hiking"],
  "Athletic Shoes": ["Running", "Training", "Hiking"],
  "Formal Shoes": ["Patent leather", "Tux shoes"],
  Outerwear: ["Overcoat", "Parka", "Raincoat", "Vest"],
  Accessories: ["Belt", "Tie", "Pocket square", "Watch", "Cufflinks", "Sunglasses"],
};

export const PATTERNS = [
  "Solid",
  "Striped",
  "Plaid",
  "Checked",
  "Gingham",
  "Floral",
  "Geometric",
  "Paisley",
  "Abstract",
  "Herringbone",
  "Houndstooth",
  "Other",
] as const;

export const FORMALITY_LEVELS = [
  { value: 1, label: "Loungewear" },
  { value: 2, label: "Casual" },
  { value: 3, label: "Smart Casual" },
  { value: 4, label: "Dressy" },
  { value: 5, label: "Formal" },
] as const;

export const SEASONS = ["SPRING", "SUMMER", "FALL", "WINTER", "ALL_SEASON"] as const;

export const ITEM_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "ORDERED", label: "Ordered" },
  { value: "ARCHIVED", label: "Archived" },
  { value: "DONATED", label: "Donated" },
  { value: "SOLD", label: "Sold" },
  { value: "NEEDS_REPAIR", label: "Needs Repair" },
  { value: "NEEDS_CLEANING", label: "Needs Cleaning" },
  { value: "BEING_ALTERED", label: "Being Altered" },
  { value: "STORED", label: "Stored" },
] as const;

export const OCCASION_TYPES = [
  { value: "CASUAL", label: "Casual" },
  { value: "SMART_CASUAL", label: "Smart Casual" },
  { value: "BUSINESS_CASUAL", label: "Business Casual" },
  { value: "BUSINESS_FORMAL", label: "Business Formal" },
  { value: "BLACK_TIE", label: "Black Tie" },
  { value: "DATE_NIGHT", label: "Date Night" },
  { value: "CHURCH", label: "Church" },
  { value: "TRAVEL", label: "Travel" },
  { value: "OUTDOOR", label: "Outdoor" },
  { value: "ATHLETIC", label: "Athletic" },
  { value: "OTHER", label: "Other" },
] as const;
