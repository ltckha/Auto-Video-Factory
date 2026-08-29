import { queryKnowledgeRegistry, KnowledgeCandidate } from "./knowledgeRegistry";

export interface ResolvedMotionChoice {
  primitiveId: "macro_push" | "punch_zoom" | "drift_cam" | "snap_zoom" | "overshoot_zoom" | "static";
  intensity: number;
  confidence: number;
  reason: string;
}

/**
 * Adapter to resolve motion choices using Legacy Knowledge Base
 */
export function adaptLegacyKnowledgeToMotion(
  effectNameOrIntent: string,
  options?: {
    brand?: string;
    platform?: string;
    isHook?: boolean;
    defaultMotion?: "macro_push" | "punch_zoom" | "drift_cam" | "snap_zoom" | "overshoot_zoom" | "static";
  }
): ResolvedMotionChoice {
  const query = String(effectNameOrIntent || "").trim();
  const defaultMotion = options?.defaultMotion || "macro_push";

  // Hook priority
  if (options?.isHook) {
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
