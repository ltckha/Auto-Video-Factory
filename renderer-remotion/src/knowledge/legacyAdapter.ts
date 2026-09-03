import { queryKnowledgeRegistry, KnowledgeCandidate } from "./knowledgeRegistry";
import { CameraMotionType } from "../styles/tokens";

export interface ResolvedMotionChoice {
  primitiveId: CameraMotionType;
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
    defaultMotion?: CameraMotionType;
  }
): ResolvedMotionChoice {
  const query = String(effectNameOrIntent || "").trim().toLowerCase();
  const defaultMotion = options?.defaultMotion || "macro_push";

  if (query.includes("push_out") || query.includes("pull_out") || query.includes("zoom_out")) {
    return {
      primitiveId: "push_out",
      intensity: 0.65,
      confidence: 0.95,
      reason: "Explicit push_out/pull_out camera command match",
    };
  }

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
