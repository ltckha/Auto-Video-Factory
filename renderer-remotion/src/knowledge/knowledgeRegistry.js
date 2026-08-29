let staticLearnedEffects = {};
let staticEffectStats = {};

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

function loadLegacyKnowledge() {
  return {
    learnedEffects: staticLearnedEffects || {},
    effectStats: staticEffectStats || {},
  };
}

function normalizeKey(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");
}

function queryKnowledgeRegistry(semanticName, category = "general") {
  const { learnedEffects, effectStats } = loadLegacyKnowledge();
  const normalizedQuery = normalizeKey(semanticName);
  const candidates = [];

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

  // 2. Fuzzy Substring Matching
  if (!matchedLegacyEffect) {
    const keys = Object.keys(learnedEffects);
    for (const k of keys) {
      if (normalizedQuery.includes(k) || k.includes(normalizedQuery)) {
        matchedLegacyEffect = learnedEffects[k];
        break;
      }
    }
  }

  // 3. Map legacy effect name to modern Remotion Primitive
  if (matchedLegacyEffect) {
    const legacyKey = matchedLegacyEffect.toLowerCase();
    const statKey = `advanced_effect:${legacyKey}`;
    const stats = effectStats[statKey] || effectStats[legacyKey];
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

module.exports = {
  loadLegacyKnowledge,
  queryKnowledgeRegistry,
};
