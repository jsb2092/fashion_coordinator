import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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

export interface ClothingAnalysis {
  category: Category;
  subcategory: string | null;
  colorPrimary: string;
  colorSecondary: string | null;
  pattern: string;
  material: string | null;
  formalityLevel: number;
  construction: string | null;
  seasonSuitability: string[];
  brandGuess: string | null;
  styleNotes: string;
}

interface ImageInput {
  base64: string;
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
}

export async function analyzeClothingImage(
  images: ImageInput | ImageInput[]
): Promise<ClothingAnalysis> {
  // Normalize to array
  const imageArray = Array.isArray(images) ? images : [images];

  // Build content array with all images first, then the text prompt
  type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const content: Array<
    | { type: "image"; source: { type: "base64"; media_type: MediaType; data: string } }
    | { type: "text"; text: string }
  > = [];

  // Add all images
  for (const img of imageArray) {
    content.push({
      type: "image" as const,
      source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
    });
  }

  // Add the analysis prompt
  const multiImageNote = imageArray.length > 1
    ? "Multiple images are provided - these may include the clothing item from different angles and/or tags/labels showing brand and material information. Use ALL images to gather complete information.\n\n"
    : "";

  content.push({
    type: "text",
    text: `${multiImageNote}Analyze this clothing item and provide structured data in JSON format.

Be specific about colors - use descriptive names like "navy blue", "charcoal grey", "burgundy", "light brown", "mint green" rather than generic "blue", "grey", etc.

Rate formality on a 1-5 scale:
1 = loungewear/athleisure
2 = casual (jeans, t-shirts)
3 = smart casual (chinos, polos)
4 = dressy (dress shirts, blazers)
5 = formal/black-tie

Categories: ${CATEGORIES.join(", ")}

Patterns: solid, striped, plaid, checked, gingham, floral, geometric, paisley, abstract, herringbone, houndstooth, other

Seasons: SPRING, SUMMER, FALL, WINTER, ALL_SEASON

Return a JSON object with these fields:
- category (from the list above)
- subcategory (specific type, e.g., "quarter-zip sweater", "cap-toe oxford")
- colorPrimary (main color)
- colorSecondary (secondary color if applicable, null if solid)
- pattern (from patterns list)
- material (from tag if visible, otherwise best guess: cotton, wool, polyester, leather, etc.)
- formalityLevel (1-5)
- construction (for blazers/jackets: "structured" or "unstructured", otherwise null)
- seasonSuitability (array of appropriate seasons)
- brandGuess (READ FROM TAG if visible, otherwise guess from style/quality, null if unknown)
- styleNotes (brief styling observations)`,
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as ClothingAnalysis;
}

export interface OutfitSuggestion {
  needsOutfit: boolean;
  outfitName?: string;
  itemIds?: string[];
  occasionType?: string;
  formalityScore?: number;
  reasoning: string;
  stylingTips?: string;
  alternatives?: {
    itemId: string;
    reason: string;
  }[];
  // For packing lists and multi-category item suggestions
  itemLists?: {
    category: string;
    itemIds: string[];
  }[];
}

interface WardrobeItemSummary {
  id: string;
  category: string;
  subcategory?: string | null;
  colorPrimary: string;
  colorSecondary?: string | null;
  pattern?: string | null;
  formalityLevel: number;
  seasonSuitability: string[];
  lastWorn?: Date | null;
  timesWorn: number;
}

interface UserPreferences {
  preferredColors?: string[];
  avoidColors?: string[];
  styleNotes?: string;
}

interface OutfitHistory {
  id: string;
  name: string;
  itemIds: string[];
  lastWorn?: Date | null;
}

interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export async function getOutfitSuggestion(
  userMessage: string,
  wardrobeItems: WardrobeItemSummary[],
  userPreferences: UserPreferences | null,
  recentOutfits: OutfitHistory[],
  conversationHistory: ConversationMessage[] = []
): Promise<OutfitSuggestion> {
  const systemPrompt = `You are a personal fashion stylist helping with wardrobe questions and outfit creation. You have access to the user's complete wardrobe and their style preferences.

Style rules to follow:
- Formality levels should be within 1 step of each other in an outfit
- Patent leather is for black-tie/formal only
- Brown shoes with a dark/black suit is stylish and modern
- Unstructured/knit blazers pair with jeans and chinos, not dress pants
- Structured blazers pair with dress pants, chinos, or dark jeans
- One pattern per outfit unless both are very subtle
- Canvas and light-soled shoes: avoid in winter/salt/snow conditions
- Quarter-zips and sweaters layer over tees or under blazers, not over dress shirts
- Short-sleeve button-ups are inherently casual (formality 2-3)
- Seersucker and linen are spring/summer only

IMPORTANT: Determine what the user is asking for:

1. QUESTIONS (what color belt, what shoes go with X, can I wear Y with Z, follow-ups):
   - Set needsOutfit: false
   - Provide helpful advice in the "reasoning" field
   - Do NOT include any item IDs in the reasoning text

2. SINGLE OUTFIT REQUEST (what to wear to dinner, build me an outfit):
   - Set needsOutfit: true
   - Include outfit fields (outfitName, itemIds, etc.)

3. PACKING LIST / MULTI-ITEM REQUEST (what to pack for a trip, wardrobe essentials):
   - Set needsOutfit: false
   - Include "itemLists" array with categorized items
   - The UI will display these as cards with images

CRITICAL: NEVER include raw item IDs in the "reasoning" text. The user cannot see what items these IDs refer to. Instead, describe items naturally (e.g., "your navy quarter-zip sweater" not "navy quarter-zip (cml6xxx)"). Item IDs should ONLY appear in the structured fields (itemIds, itemLists) where the UI will render them as images.

Always respond with a valid JSON object containing:
- needsOutfit: boolean - true only for single outfit requests
- reasoning: your response/advice to the user (REQUIRED, NO item IDs in this text!)

If needsOutfit is true, ALSO include:
- outfitName: descriptive name for this outfit
- itemIds: array of item IDs from the wardrobe
- occasionType: MUST be one of: CASUAL, SMART_CASUAL, BUSINESS_CASUAL, BUSINESS_FORMAL, BLACK_TIE, DATE_NIGHT, CHURCH, TRAVEL, OUTDOOR, ATHLETIC, OTHER
- formalityScore: 1-5 rating
- stylingTips: additional styling advice

For PACKING LISTS / MULTI-ITEM REQUESTS, include:
- itemLists: array of {category: "Tops", itemIds: ["id1", "id2"]} objects
  Categories like: "Bottoms", "Tops", "Layering", "Shoes", "Accessories", etc.`;

  // Build wardrobe context to include with first user message
  const wardrobeContext = `
My wardrobe:
${JSON.stringify(wardrobeItems, null, 2)}

My preferences:
${JSON.stringify(userPreferences || {}, null, 2)}

Recent outfits worn:
${JSON.stringify(recentOutfits.slice(0, 5), null, 2)}
`;

  // Build conversation summary from history for context
  // Only include user messages since assistant responses are text (not JSON)
  const previousUserRequests = conversationHistory
    .filter(msg => msg.role === "user")
    .filter(msg => !msg.content.includes("I'm here to help")) // Skip if somehow included
    .map(msg => msg.content);

  // Build the full context including previous requests
  let conversationContext = "";
  if (previousUserRequests.length > 0) {
    conversationContext = `\n\nPrevious requests in this conversation:\n${previousUserRequests.map((req, i) => `${i + 1}. ${req}`).join("\n")}\n\nThe user is now following up on the above. Consider the full conversation context.`;
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `${wardrobeContext}${conversationContext}\n\nCurrent request: ${userMessage}\n\nReturn only valid JSON.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as OutfitSuggestion;
}

// Shoe Care Supply Analysis
export const SUPPLY_CATEGORIES = [
  "POLISH",
  "BRUSH",
  "TREE",
  "CLEANER",
  "PROTECTION",
  "CLOTH",
  "TOOL",
  "LACES",
  "KIT",
  "OTHER",
] as const;

export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number];

export interface SupplyAnalysis {
  name: string;
  category: SupplyCategory;
  subcategory: string | null;
  brand: string | null;
  color: string | null;
  size: string | null;
  compatibleColors: string[];
  compatibleMaterials: string[];
  notes: string | null;
  estimatedPrice: number | null;
  reorderUrl: string | null;
}

export async function analyzeSupplyImage(
  images: ImageInput | ImageInput[]
): Promise<SupplyAnalysis> {
  const imageArray = Array.isArray(images) ? images : [images];

  type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const content: Array<
    | { type: "image"; source: { type: "base64"; media_type: MediaType; data: string } }
    | { type: "text"; text: string }
  > = [];

  for (const img of imageArray) {
    content.push({
      type: "image" as const,
      source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
    });
  }

  const multiImageNote = imageArray.length > 1
    ? "Multiple images are provided. Use ALL images to gather complete information.\n\n"
    : "";

  content.push({
    type: "text",
    text: `${multiImageNote}Analyze this shoe care product/supply and provide structured data in JSON format.

Categories: POLISH (cream polish, wax polish, liquid polish, edge dressing, renovateur), BRUSH (horsehair brush, dauber brush, suede brush, shine brush, welt brush), TREE (cedar shoe tree, plastic shoe tree, boot tree), CLEANER (saddle soap, leather cleaner, suede cleaner), PROTECTION (water repellent, leather conditioner, suede protector, mink oil), CLOTH (polishing cloth, microfiber cloth, chamois, application cloth, buffing cloth), TOOL (shoe horn, edge burnisher, heel grips, tongue pads), LACES (dress laces, round laces, flat laces, waxed laces), KIT (complete care kit, starter kit, travel kit), OTHER

Polish/cream colors: Black, Burgundy, Dark Brown, Medium Brown, Light Brown, Tan, Cognac, Navy, Neutral, Oxblood, Cordovan, Walnut, Mahogany

Compatible materials: Smooth leather, Full-grain leather, Corrected-grain leather, Patent leather, Suede, Nubuck, Shell cordovan, Exotic leather, Canvas, Synthetic, Rubber

Common brands: Allen Edmonds, Angelus, Bickmore, Boot Black, Collonil, Fiebing's, FootFitter, Kiwi, Lincoln, Meltonian, Moneysworth & Best, Saphir, Tarrago, Venetian, Woodlore

Return a JSON object with these fields:
- name: product name (e.g., "Saphir Pate de Luxe Wax Polish")
- category: from categories list above
- subcategory: specific type (e.g., "wax polish", "horsehair brush", "cedar shoe tree")
- brand: READ FROM LABEL if visible, otherwise guess from style
- color: for polish/cream products, the color (from polish colors list); null for brushes/tools
- size: product size if visible (e.g., "75ml", "50g", "Large")
- compatibleColors: array of shoe colors this product works with (for polishes/creams)
- compatibleMaterials: array of materials this product works with
- notes: any relevant product details or usage tips
- estimatedPrice: rough price estimate in USD if recognizable product, null otherwise
- reorderUrl: null (will be filled in separately)`,
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{ role: "user", content }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  return JSON.parse(jsonMatch[0]) as SupplyAnalysis;
}

export async function analyzeSupplyFromUrl(url: string): Promise<SupplyAnalysis> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Extract shoe care product information from this URL: ${url}

This is likely an Amazon or retailer product page. Based on the URL and any product identifiers in it, identify what shoe care product this is.

Categories: POLISH, BRUSH, TREE, CLEANER, PROTECTION, CLOTH, TOOL, LACES, KIT, OTHER

Polish/cream colors: Black, Burgundy, Dark Brown, Medium Brown, Light Brown, Tan, Cognac, Navy, Neutral, Oxblood, Cordovan, Walnut, Mahogany

Compatible materials: Smooth leather, Full-grain leather, Corrected-grain leather, Patent leather, Suede, Nubuck, Shell cordovan, Exotic leather, Canvas, Synthetic, Rubber

Common shoe care brands: Allen Edmonds, Angelus, Bickmore, Boot Black, Collonil, Fiebing's, FootFitter, Kiwi, Lincoln, Meltonian, Moneysworth & Best, Saphir, Tarrago, Venetian, Woodlore

Return a JSON object with:
- name: product name
- category: from categories list
- subcategory: specific type
- brand: brand name
- color: for polish/cream products (null for brushes/tools)
- size: product size if determinable
- compatibleColors: array of shoe colors this works with
- compatibleMaterials: array of compatible materials
- notes: product details or usage tips
- estimatedPrice: null
- reorderUrl: the original URL provided`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  const result = JSON.parse(jsonMatch[0]) as SupplyAnalysis;
  // Ensure reorderUrl is set
  result.reorderUrl = url;
  return result;
}

// For analyzing kits that contain multiple items
export interface KitAnalysisResult {
  isKit: boolean;
  kitName: string | null;
  items: SupplyAnalysis[];
}

export async function analyzeSupplyKitFromUrl(url: string, pageContent?: string, userDescription?: string): Promise<KitAnalysisResult> {
  const contentContext = pageContent
    ? `Here is the page content from ${url}:\n\n${pageContent}\n\n`
    : `URL: ${url}\n\n`;

  const userDescContext = userDescription
    ? `\nThe user has provided this description of what the kit contains:\n"${userDescription}"\n\nIMPORTANT: Use this description to identify each individual item. The user knows what they bought, so trust their description and create separate entries for each item mentioned.\n\n`
    : "";

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `${contentContext}${userDescContext}Analyze this shoe care product information.

Determine if this is a SINGLE PRODUCT or a KIT containing multiple items.

If it's a KIT (like "FootFitter Complete Shoe Care Kit" or "Saphir Medaille d'Or Starter Set"):
- Set isKit: true
- Set kitName to the kit's name
- List EACH individual item in the kit separately in the items array

If it's a SINGLE PRODUCT:
- Set isKit: false
- Set kitName: null
- Put the single product in the items array

Categories: POLISH, BRUSH, TREE, CLEANER, PROTECTION, CLOTH, TOOL, LACES, KIT, OTHER

Polish/cream colors: Black, Burgundy, Dark Brown, Medium Brown, Light Brown, Tan, Cognac, Navy, Neutral, Oxblood, Cordovan, Walnut, Mahogany

Compatible materials: Smooth leather, Full-grain leather, Corrected-grain leather, Patent leather, Suede, Nubuck, Shell cordovan, Exotic leather, Canvas, Synthetic, Rubber

Common shoe care brands: Allen Edmonds, Angelus, Bickmore, Boot Black, Collonil, Fiebing's, FootFitter, Kiwi, Lincoln, Meltonian, Moneysworth & Best, Saphir, Tarrago, Venetian, Woodlore

Return a JSON object with:
{
  "isKit": boolean,
  "kitName": string or null,
  "items": [
    {
      "name": "Individual item name (e.g., 'FootFitter Black Cream Polish')",
      "category": "POLISH" | "BRUSH" | "TREE" | etc.,
      "subcategory": "specific type",
      "brand": "brand name",
      "color": "for polish/cream" or null,
      "size": "size if known" or null,
      "compatibleColors": ["array", "of", "colors"],
      "compatibleMaterials": ["array", "of", "materials"],
      "notes": "usage tips for this specific item",
      "estimatedPrice": null,
      "reorderUrl": null
    }
  ]
}

For kits, list ALL items - for example a "Complete Kit" might include:
- Multiple cream polishes in different colors (Black, Dark Brown, Neutral, etc.)
- Horsehair brushes (separate entries for light/dark)
- Dauber brushes
- Microfiber cloths
- Shoe horn
etc.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse Claude response as JSON");
  }

  const result = JSON.parse(jsonMatch[0]) as KitAnalysisResult;

  // Set reorderUrl on all items
  result.items = result.items.map(item => ({
    ...item,
    reorderUrl: url,
  }));

  return result;
}

// Analyze kit from user description (with optional photo)
export async function analyzeKitFromDescription(
  description: string,
  images?: Array<{ base64: string; mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" }>
): Promise<KitAnalysisResult> {
  type MediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";
  const content: Array<
    | { type: "image"; source: { type: "base64"; media_type: MediaType; data: string } }
    | { type: "text"; text: string }
  > = [];

  // Add images if provided
  if (images && images.length > 0) {
    for (const img of images) {
      content.push({
        type: "image" as const,
        source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
      });
    }
  }

  content.push({
    type: "text",
    text: `The user has a shoe care kit and has described its contents:

"${description}"

Parse this description and create a separate entry for EACH individual item mentioned. The user knows what they bought, so trust their description completely.

Categories: POLISH, BRUSH, TREE, CLEANER, PROTECTION, CLOTH, TOOL, LACES, KIT, OTHER

Polish/cream colors: Black, Burgundy, Dark Brown, Medium Brown, Light Brown, Tan, Cognac, Navy, Neutral, Oxblood, Cordovan, Walnut, Mahogany

Compatible materials: Smooth leather, Full-grain leather, Corrected-grain leather, Patent leather, Suede, Nubuck, Shell cordovan, Exotic leather, Canvas, Synthetic, Rubber

Return a JSON object with:
{
  "isKit": true,
  "kitName": "infer a name from the description or use 'Shoe Care Kit'",
  "items": [
    {
      "name": "Individual item name (e.g., 'Black Cream Polish', 'Horsehair Brush - Light')",
      "category": "POLISH" | "BRUSH" | "CLOTH" | etc.,
      "subcategory": "specific type",
      "brand": "brand if mentioned" or null,
      "color": "for polish/cream" or null,
      "size": null,
      "compatibleColors": ["array", "of", "colors"] (for polishes, infer from color),
      "compatibleMaterials": ["Smooth leather", "Full-grain leather"] (reasonable defaults),
      "notes": null,
      "estimatedPrice": null,
      "reorderUrl": null
    }
  ]
}

IMPORTANT:
- If the user says "2 brushes", create 2 separate brush entries
- If colors are mentioned (e.g., "light and dark brush"), create separate entries for each
- Every distinct item should be a separate entry in the items array`,
  });

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse kit description");
  }

  return JSON.parse(jsonMatch[0]) as KitAnalysisResult;
}

// Generate personalized shoe care instructions
export interface ShoeForCare {
  category: string;
  subcategory?: string | null;
  colorPrimary: string;
  colorSecondary?: string | null;
  material?: string | null;
  brand?: string | null;
}

export interface SupplyForCare {
  name: string;
  category: string;
  subcategory?: string | null;
  intendedUse?: string | null;
  buffOrder?: string | null;
  brand?: string | null;
  color?: string | null;
  compatibleColors: string[];
  compatibleMaterials: string[];
}

export interface CareInstructions {
  title: string;
  suppliesNeeded: {
    name: string;
    purpose: string;
    owned: boolean;
  }[];
  steps: {
    step: number;
    title: string;
    description: string;
    supplyUsed?: string;
    duration?: string;
    tips?: string;
  }[];
  frequency: string;
  warnings?: string[];
  quickMaintenanceTips: string[];
}

export async function generateCareInstructions(
  shoe: ShoeForCare,
  availableSupplies: SupplyForCare[],
  careType: "full_polish" | "quick_clean" | "deep_condition" = "full_polish"
): Promise<CareInstructions> {
  const careTypeDescriptions = {
    full_polish: "Full polish and shine (monthly or every 4-6 wears)",
    quick_clean: "Quick maintenance clean (after each wear or weekly)",
    deep_condition: "Deep conditioning treatment (every 3-4 months or after getting wet)",
  };

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate personalized shoe care instructions for this shoe using the owner's available supplies.

SHOE:
- Type: ${shoe.category}${shoe.subcategory ? ` (${shoe.subcategory})` : ""}
- Color: ${shoe.colorPrimary}${shoe.colorSecondary ? ` / ${shoe.colorSecondary}` : ""}
- Material: ${shoe.material || "leather (assumed)"}
- Brand: ${shoe.brand || "Unknown"}

AVAILABLE SUPPLIES:
${availableSupplies.map(s => {
  let details = [s.category];
  if (s.subcategory) details.push(s.subcategory);
  if (s.color) details.push(s.color);
  if (s.intendedUse) details.push(`for ${s.intendedUse.toLowerCase()} only`);
  if (s.buffOrder) details.push(`buff order: ${s.buffOrder.toLowerCase()}`);
  return `- ${s.name} (${details.join(", ")})`;
}).join("\n")}

IMPORTANT RULES:
1. If a supply has a specific intended use (e.g., "for cleaning only"), only use it for that purpose.
2. For brushes with buff order specified: "initial" = use right after applying polish, "final" = use for last buffing step before cloth.
3. If buff order is NOT specified but the brush name contains "Final" or "Shine", use it for final buffing. If name contains "Initial" or "First", use for initial buffing.
4. When multiple shine/polish brushes are available for the same color, use one for initial buffing after cream polish and a different one for final shine. This keeps the final brush cleaner for a better shine.

CARE TYPE REQUESTED: ${careTypeDescriptions[careType]}

Based on the shoe color (${shoe.colorPrimary}), recommend the best matching cream/polish from their supplies. For example:
- Black shoes → Black cream
- Cognac/Tan shoes → Light Brown cream
- Dark brown shoes → Dark Brown cream
- Oxblood/Burgundy → Dark Brown or Burgundy cream
- If no exact match, Neutral is safe for any color

Return a JSON object with:
{
  "title": "Care instructions title (e.g., 'Full Polish for Cognac Leather Oxfords')",
  "suppliesNeeded": [
    {"name": "specific supply from their list or generic if they don't have it", "purpose": "what it's used for", "owned": true/false}
  ],
  "steps": [
    {
      "step": 1,
      "title": "Step title",
      "description": "Detailed instructions",
      "supplyUsed": "which supply to use (from their supplies)",
      "duration": "how long (e.g., '5 minutes')",
      "tips": "pro tips for this step"
    }
  ],
  "frequency": "How often to do this type of care",
  "warnings": ["Any warnings specific to this shoe type/color"],
  "quickMaintenanceTips": ["Tips for between full polishes"]
}

Use their ACTUAL supply names in the instructions. If they're missing something important, include it with owned: false.`,
      },
    ],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse care instructions");
  }

  return JSON.parse(jsonMatch[0]) as CareInstructions;
}

export async function* streamChat(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  wardrobeContext: string
) {
  const systemPrompt = `You are a helpful fashion assistant for a personal wardrobe app. You help users:
- Get outfit suggestions for specific occasions
- Understand what goes well together
- Make the most of their existing wardrobe
- Plan outfits for trips and events

You have access to the user's wardrobe:
${wardrobeContext}

Be conversational, helpful, and specific. When suggesting outfits, reference specific items by their descriptions. Keep responses concise but informative.`;

  const stream = await anthropic.messages.stream({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: messages,
  });

  for await (const event of stream) {
    if (
      event.type === "content_block_delta" &&
      event.delta.type === "text_delta"
    ) {
      yield event.delta.text;
    }
  }
}
