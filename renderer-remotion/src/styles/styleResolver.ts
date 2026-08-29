import { DesignToken } from "./tokens";
import { asmrCraftToken } from "./asmrCraft";
import { viralTikTokToken } from "./viralTikTok";
import { luxuryEditorialToken } from "./luxuryEditorial";
import { cinematicTravelToken } from "./cinematicTravel";
import { foodSocialToken, productCommercialToken } from "./foodAndProduct";

export const STYLE_REGISTRY: Record<string, DesignToken> = {
  asmr_craft: asmrCraftToken,
  viral_tiktok: viralTikTokToken,
  luxury_editorial: luxuryEditorialToken,
  cinematic_travel: cinematicTravelToken,
  food_social: foodSocialToken,
  product_commercial: productCommercialToken,
};

export function resolveStyleToken(creativeIntent: {
  style?: string;
  subtitle_style?: string;
  pipeline_mode?: string;
  title?: string;
  hashtags?: string[];
}): DesignToken {
  // 1. Explicit Style Key Resolution
  const explicitKey = String(creativeIntent.style || "").toLowerCase().trim();
  if (explicitKey && STYLE_REGISTRY[explicitKey]) {
    return STYLE_REGISTRY[explicitKey];
  }

  // 2. Subtitle Style Legacy Mapping
  const subStyle = String(creativeIntent.subtitle_style || "").toLowerCase();
  if (subStyle.includes("yellow_lightning") || subStyle.includes("sticker")) {
    return viralTikTokToken;
  }
  if (subStyle.includes("warning") || subStyle.includes("red")) {
    return productCommercialToken;
  }

  // 3. Keyword / Niche Heuristic Deduction
  const textCorpus = [
    creativeIntent.title || "",
    ...(creativeIntent.hashtags || []),
    creativeIntent.pipeline_mode || "",
  ].join(" ").toLowerCase();

  if (textCorpus.includes("dalat") || textCorpus.includes("travel") || textCorpus.includes("dji") || textCorpus.includes("nightride")) {
    return cinematicTravelToken;
  }
  if (textCorpus.includes("food") || textCorpus.includes("nauan") || textCorpus.includes("monngon") || textCorpus.includes("cooking")) {
    return foodSocialToken;
  }
  if (textCorpus.includes("luxury") || textCorpus.includes("boots") || textCorpus.includes("vogue") || textCorpus.includes("thoitrang")) {
    return luxuryEditorialToken;
  }
  if (textCorpus.includes("tiktok") || textCorpus.includes("viral") || textCorpus.includes("challenge")) {
    return viralTikTokToken;
  }

  // Default Baseline Style Token (YEN Leather / ASMR Craft)
  return asmrCraftToken;
}
