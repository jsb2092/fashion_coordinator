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

export async function analyzeClothingImage(
  imageData: string,
  mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg"
): Promise<ClothingAnalysis> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageData },
          },
          {
            type: "text",
            text: `Analyze this clothing item photo and provide structured data in JSON format.

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
- material (best guess: cotton, wool, polyester, leather, etc.)
- formalityLevel (1-5)
- construction (for blazers/jackets: "structured" or "unstructured", otherwise null)
- seasonSuitability (array of appropriate seasons)
- brandGuess (if visible or recognizable, otherwise null)
- styleNotes (brief styling observations)`,
          },
        ],
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
  outfitName: string;
  itemIds: string[];
  occasionType: string;
  formalityScore: number;
  reasoning: string;
  stylingTips: string;
  alternatives?: {
    itemId: string;
    reason: string;
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
  const systemPrompt = `You are a personal fashion stylist helping create outfits. You have access to the user's complete wardrobe and their style preferences.

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

When suggesting outfits:
1. Consider the occasion and required formality level
2. Ensure color coordination and pattern mixing rules
3. Account for seasonal appropriateness
4. Avoid items the user recently wore (shown in history)
5. Explain your reasoning for each choice

Always respond with a valid JSON object containing:
- outfitName: descriptive name for this outfit
- itemIds: array of item IDs from the wardrobe
- occasionType: type of occasion this is for
- formalityScore: 1-5 rating
- reasoning: explain why you chose each piece
- stylingTips: additional styling advice
- alternatives: optional array of {itemId, reason} for swap suggestions`;

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

Please suggest an outfit with specific items from my wardrobe. Return only valid JSON.`,
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
