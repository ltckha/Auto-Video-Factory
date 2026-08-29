import { DesignToken } from "./tokens";
import { STYLE_REGISTRY, resolveStyleToken } from "./styleResolver";
import { BRAND_PROFILES, BrandDnaProfile } from "../brand/brandDna";

export type PlatformType = "tiktok" | "youtube_shorts" | "facebook" | "instagram_reels";

export interface CreativeInput {
  content?: {
    text?: string;
    title?: string;
    hashtags?: string[];
    pipeline_mode?: string;
  };
  intent?: {
    style?: string;
    subtitle_style?: string;
    emotion?: string;
    energy?: number; // 0.0 -> 1.0
    focus?: string;
  };
  brand?: string;
  platform?: PlatformType;
}

export interface DesignSpecification {
  token: DesignToken;
  intensity: number;
  brand: BrandDnaProfile;
  platform: PlatformType;
}

/**
 * Sanitize text to remove HTML tags, normalize spaces, and provide normalized search corpus
 */
export function sanitizeText(input: any): string {
  if (input === null || input === undefined) return "";
  const str = String(input);
  const cleanHtml = str.replace(/<[^>]*>?/gm, "");
  return cleanHtml.replace(/\s+/g, " ").trim();
}

export function normalizeSearchText(input: any): string {
  const clean = sanitizeText(input).toLowerCase();
  // Strip Vietnamese diacritics for robust intent matching
  return clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d");
}

export function resolveCreativeSpecification(input: CreativeInput = {}): DesignSpecification {
  const platform = input?.platform || "tiktok";
  const brandKey = input?.brand || "yen_leather";
  const brand = BRAND_PROFILES[brandKey] || BRAND_PROFILES.yen_leather;

  // 1. Sanitize Content & Intent Inputs
  const title = sanitizeText(input?.content?.title);
  const hashtags = Array.isArray(input?.content?.hashtags)
    ? input.content.hashtags.map(sanitizeText).filter(Boolean)
    : [];
  const pipelineMode = sanitizeText(input?.content?.pipeline_mode);

  // 2. Resolve Base Style Token with robust diacritic-insensitive matching
  let rawStyle = String(input?.intent?.style || "").toLowerCase().trim();
  let resolvedStyle = "";

  if (rawStyle && STYLE_REGISTRY[rawStyle]) {
    resolvedStyle = rawStyle;
  } else {
    const textCorpus = [
      normalizeSearchText(title),
      ...hashtags.map(normalizeSearchText),
      normalizeSearchText(pipelineMode),
    ].join(" ");

    if (textCorpus.includes("nhuom") || textCorpus.includes("phuc hoi") || textCorpus.includes("asmr") || textCorpus.includes("craft") || textCorpus.includes("ve sinh") || textCorpus.includes("thu cong") || textCorpus.includes("giay")) {
      resolvedStyle = "asmr_craft";
    } else if (textCorpus.includes("dalat") || textCorpus.includes("travel") || textCorpus.includes("dji") || textCorpus.includes("du lich")) {
      resolvedStyle = "cinematic_travel";
    } else if (textCorpus.includes("luxury") || textCorpus.includes("boots") || textCorpus.includes("vogue") || textCorpus.includes("thoi trang")) {
      resolvedStyle = "luxury_editorial";
    } else if (textCorpus.includes("viral") || textCorpus.includes("bien hinh") || textCorpus.includes("transformation")) {
      resolvedStyle = "viral_tiktok";
    } else if (textCorpus.includes("food") || textCorpus.includes("nau an") || textCorpus.includes("mon ngon")) {
      resolvedStyle = "food_social";
    } else {
      resolvedStyle = brand?.defaultStyle || "asmr_craft";
    }
  }

  const baseToken = resolveStyleToken({
    style: resolvedStyle,
    subtitle_style: input?.intent?.subtitle_style,
    pipeline_mode: pipelineMode,
    title,
    hashtags,
  });

  // Clone token for non-destructive mutation
  const token: DesignToken = JSON.parse(JSON.stringify(baseToken));

  // 3. Compute Target Motion Intensity with Strict Bounds Clamping ($0.1 \rightarrow 1.0$)
  let rawEnergy = Number(input?.intent?.energy);
  if (isNaN(rawEnergy)) {
    rawEnergy = 0.65;
  }
  const normalizedEnergy = Math.max(0.0, Math.min(1.0, rawEnergy));

  // Platform-Aware Multipliers
  let platformMultiplier = 1.0;
  if (platform === "tiktok" || platform === "instagram_reels") {
    platformMultiplier = 1.25;
    token.motion.wordStaggerFrames = Math.max(1.8, token.motion.wordStaggerFrames - 0.4);
  } else if (platform === "facebook") {
    platformMultiplier = 0.80;
    token.motion.wordStaggerFrames = token.motion.wordStaggerFrames + 0.5;
    token.typography.baseFontSize = token.typography.baseFontSize + 2;
  }

  const brandMultiplier = brand?.energyMultiplier || 1.0;
  const finalIntensity = Number(
    Math.min(1.0, Math.max(0.1, normalizedEnergy * brandMultiplier * platformMultiplier)).toFixed(2)
  );

  // 4. Apply Brand DNA Adjustments
  if (brand?.typographyModifier?.fontWeight) {
    token.typography.fontWeight = brand.typographyModifier.fontWeight;
  }

  return {
    token,
    intensity: finalIntensity,
    brand,
    platform,
  };
}
