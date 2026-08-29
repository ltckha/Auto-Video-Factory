const { queryKnowledgeRegistry } = require("./knowledgeRegistry");

function adaptLegacyKnowledgeToMotion(effectNameOrIntent, options = {}) {
  const query = String(effectNameOrIntent || "").trim();
  const defaultMotion = options.defaultMotion || "macro_push";

  if (options.isHook) {
    return {
      primitiveId: "punch_zoom",
      intensity: 0.85,
      confidence: 0.95,
      reason: "Hook scene dynamic punch zoom override",
    };
  }

  const candidates = queryKnowledgeRegistry(query);
  const topCandidate = candidates[0];

  if (topCandidate && topCandidate.confidence >= 0.75) {
    return {
      primitiveId: topCandidate.primitiveId,
      intensity: topCandidate.recommendedIntensity,
      confidence: topCandidate.confidence,
      reason: `Matched via Knowledge Registry (${topCandidate.source}) with historical confidence ${topCandidate.confidence.toFixed(2)}`,
    };
  }

  return {
    primitiveId: defaultMotion,
    intensity: 0.55,
    confidence: 0.60,
    reason: "Default style token fallback",
  };
}

module.exports = {
  adaptLegacyKnowledgeToMotion,
};
