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

export async function getOutfitSuggestion(
  userMessage: string,
  wardrobeItems: WardrobeItemSummary[],
  userPreferences: UserPreferences | null,
  recentOutfits: OutfitHistory[]
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

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `
My wardrobe:
${JSON.stringify(wardrobeItems, null, 2)}

My preferences:
${JSON.stringify(userPreferences || {}, null, 2)}

Recent outfits worn:
${JSON.stringify(recentOutfits.slice(0, 5), null, 2)}

User request: ${userMessage}

Determine if this needs a new outfit or is just a question. Return only valid JSON.`,
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
