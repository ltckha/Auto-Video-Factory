export interface KnowledgeCandidate {
  primitiveId: "macro_push" | "punch_zoom" | "drift_cam" | "snap_zoom";
  confidence: number; // 0.0 -> 1.0
  source: "semantic_match" | "style_recipe" | "stats_candidate" | "fallback";
  recommendedIntensity: number;
  historicalSuccessRate?: number;
}

export interface LearnedStyleProfile {
  name: string;
  category_niche: string;
  average_scene_duration_s?: number;
  pacing_speed?: string;
  hook_strategy?: string;
  preferred_font_layout?: string;
}

export interface LegacyKnowledgeData {
  learnedEffects: Record<string, string>;
  effectStats: Record<string, { success: number; fail: number }>;
  learnedStyles: Record<string, LearnedStyleProfile>;
}

let staticLearnedEffects: Record<string, string> = {};
let staticEffectStats: Record<string, { success: number; fail: number }> = {};
const staticLearnedStyles: Record<string, LearnedStyleProfile> = {};

try {
  staticLearnedEffects = require("../../../../effects/learned_effects.json");
} catch {
  try {
    staticLearnedEffects = require("../../../effects/learned_effects.json");
  } catch {}
}

try {
  staticEffectStats = require("../../../../effects/effect_success_stats.json");
} catch {
  try {
    staticEffectStats = require("../../../effects/effect_success_stats.json");
  } catch {}
}

// Ingest all style recipes from learned_styles
const knownStyleKeys = [
  "artisan_french_pricking_iron_leathercraft_asmr",
  "asmr_architectural_satisfying_build",
  "asmr_chisel_wood_shaving",
  "bespoke_leather_sole_stitching_asmr",
  "cozy_minimalist_iced_latte_routine",
  "dynamic_loafer_showcase",
  "hydraulic_press_stress_destruction_showcase",
  "macro_carbide_blade_honing_asmr",
  "master_artisan_mirror_shoeshine_asmr",
  "precision_japanese_mortise_tenon_joinery_asmr",
  "romantic_lifestyle_split-collage",
  "seamless_inverted_flip_outfit_transformation",
  "tactile_tech_unboxing_accessory_asmr",
];

for (const key of knownStyleKeys) {
  try {
    const data = require(`../../../../effects/learned_styles/${key}.json`);
    if (data?.style_profile) {
      staticLearnedStyles[key] = data.style_profile;
    }
  } catch {
    try {
      const data = require(`../../../effects/learned_styles/${key}.json`);
      if (data?.style_profile) {
        staticLearnedStyles[key] = data.style_profile;
      }
    } catch {}
  }
}

export function loadLegacyKnowledge(): LegacyKnowledgeData {
  return {
    learnedEffects: staticLearnedEffects || {},
    effectStats: staticEffectStats || {},
    learnedStyles: staticLearnedStyles || {},
  };
}

function normalizeKey(str: string): string {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

export function queryKnowledgeRegistry(
  semanticName: string,
  category = "general"
): KnowledgeCandidate[] {
  const { learnedEffects, effectStats, learnedStyles } = loadLegacyKnowledge();
  const normalizedQuery = normalizeKey(semanticName);
  const candidates: KnowledgeCandidate[] = [];

  if (!normalizedQuery) {
    return [
      {
        primitiveId: "macro_push",
        confidence: 0.5,
        source: "fallback",
        recommendedIntensity: 0.5,
      },
    ];
  }

  // 1. Direct Semantic Match
  let matchedLegacyEffect = learnedEffects[normalizedQuery];

  // 2. Style Recipe Keyword Search (e.g., leathercraft, shoeshine, latte)
  for (const [styleKey, profile] of Object.entries(learnedStyles)) {
    const keyNorm = normalizeKey(styleKey);
    const nicheNorm = normalizeKey(profile.category_niche);
    if (normalizedQuery.includes(keyNorm) || normalizedQuery.includes(nicheNorm)) {
      if (keyNorm.includes("asmr") || keyNorm.includes("leather") || keyNorm.includes("shoeshine")) {
        candidates.push({
          primitiveId: "macro_push",
          confidence: 0.92,
          source: "style_recipe",
          recommendedIntensity: 0.40,
        });
      } else if (keyNorm.includes("dynamic") || keyNorm.includes("unboxing") || keyNorm.includes("press")) {
        candidates.push({
          primitiveId: "punch_zoom",
          confidence: 0.90,
          source: "style_recipe",
          recommendedIntensity: 0.85,
        });
      }
      break;
    }
  }

  // 3. Fuzzy Substring Matching in learned_effects
  if (!matchedLegacyEffect && candidates.length === 0) {
    const keys = Object.keys(learnedEffects);
    for (const k of keys) {
      if (normalizedQuery.includes(k) || k.includes(normalizedQuery)) {
        matchedLegacyEffect = learnedEffects[k];
        break;
      }
    }
  }

  // 4. Map legacy effect name to modern Remotion Primitive
  if (matchedLegacyEffect) {
    const legacyKey = matchedLegacyEffect.toLowerCase();
    const statKey = `advanced_effect:${legacyKey}`;
    const stats = (effectStats as any)[statKey] || (effectStats as any)[legacyKey];
    const successRate = stats ? stats.success / Math.max(1, stats.success + stats.fail) : 0.9;

    if (legacyKey.includes("zoomsoft") || legacyKey.includes("cinematic") || legacyKey.includes("push")) {
      candidates.push({
        primitiveId: "macro_push",
        confidence: 0.95 * successRate,
        source: "semantic_match",
        recommendedIntensity: 0.45,
        historicalSuccessRate: successRate,
      });
    } else if (legacyKey.includes("overshoot") || legacyKey.includes("snap") || legacyKey.includes("zoomin")) {
      candidates.push({
        primitiveId: "punch_zoom",
        confidence: 0.90 * successRate,
        source: "semantic_match",
        recommendedIntensity: 0.85,
        historicalSuccessRate: successRate,
      });
    } else if (legacyKey.includes("drift") || legacyKey.includes("pan") || legacyKey.includes("smooth")) {
      candidates.push({
        primitiveId: "drift_cam",
        confidence: 0.85 * successRate,
        source: "semantic_match",
        recommendedIntensity: 0.55,
        historicalSuccessRate: successRate,
      });
    } else {
      candidates.push({
        primitiveId: "snap_zoom",
        confidence: 0.80 * successRate,
        source: "semantic_match",
        recommendedIntensity: 0.70,
        historicalSuccessRate: successRate,
      });
    }
  }

  if (candidates.length === 0) {
    candidates.push({
      primitiveId: "macro_push",
      confidence: 0.6,
      source: "fallback",
      recommendedIntensity: 0.5,
    });
  }

  return candidates;
}
