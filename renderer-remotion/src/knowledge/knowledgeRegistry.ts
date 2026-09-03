export interface KnowledgeCandidate {
  primitiveId: "macro_push" | "punch_zoom" | "drift_cam" | "snap_zoom" | "cinematic_glide_zoom";
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

// Ingest all style recipes using Webpack require.context (100% browser/Remotion-safe, no fs or path)
try {
  // @ts-ignore
  if (typeof require !== "undefined" && typeof require.context === "function") {
    // @ts-ignore
    const req = require.context("../../../../effects/learned_styles", false, /\.json$/);
    req.keys().forEach((filename: string) => {
      try {
        const data = req(filename);
        const styleKey = filename.replace(/^\.\//, "").replace(/\.json$/, "");
        if (data?.style_profile) {
          staticLearnedStyles[styleKey] = data.style_profile;
        }
      } catch {}
    });
  }
} catch {}

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

/**
 * Intelligent Semantic Knowledge Engine
 */
export function queryKnowledgeRegistry(query: string): KnowledgeCandidate[] {
  const normQuery = normalizeKey(query);
  const legacy = loadLegacyKnowledge();
  const candidates: KnowledgeCandidate[] = [];

  // 1. Direct Semantic Exact/Fuzzy Match from 231+ mappings
  if (normQuery) {
    for (const [rawKey, targetMotion] of Object.entries(legacy.learnedEffects)) {
      const normRaw = normalizeKey(rawKey);
      if (normRaw && (normQuery.includes(normRaw) || normRaw.includes(normQuery))) {
        let primitiveId: KnowledgeCandidate["primitiveId"] = "macro_push";
        if (targetMotion.includes("punch") || targetMotion.includes("zoom")) {
          primitiveId = "punch_zoom";
        } else if (targetMotion.includes("drift")) {
          primitiveId = "drift_cam";
        }

        const stats = legacy.effectStats[rawKey];
        const successRate = stats ? stats.success / Math.max(1, stats.success + stats.fail) : 0.9;

        candidates.push({
          primitiveId,
          confidence: 0.95,
          source: "semantic_match",
          recommendedIntensity: primitiveId === "punch_zoom" ? 0.85 : 0.7,
          historicalSuccessRate: successRate,
        });
      }
    }
  }

  // 2. Style Recipe Context Match
  for (const [styleKey, profile] of Object.entries(legacy.learnedStyles)) {
    const normStyle = normalizeKey(styleKey + " " + (profile.name || "") + " " + (profile.category_niche || ""));
    if (normQuery && normStyle.includes(normQuery)) {
      let primitiveId: KnowledgeCandidate["primitiveId"] = "macro_push";
      let recommendedIntensity = 0.7;

      if (profile.pacing_speed === "slow_glide" || normStyle.includes("phonk") || normStyle.includes("glide")) {
        primitiveId = "cinematic_glide_zoom";
        recommendedIntensity = 0.8;
      } else if (profile.pacing_speed === "fast" || profile.category_niche?.includes("destruction")) {
        primitiveId = "punch_zoom";
        recommendedIntensity = 0.9;
      }

      candidates.push({
        primitiveId,
        confidence: 0.88,
        source: "style_recipe",
        recommendedIntensity,
      });
    }
  }

  if (candidates.length === 0) {
    candidates.push({
      primitiveId: "macro_push",
      confidence: 0.70,
      source: "fallback",
      recommendedIntensity: 0.65,
    });
  }

  return candidates;
}
