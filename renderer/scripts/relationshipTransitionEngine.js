/**
 * Architectural Layer 4: Relationship-Based Transition Engine (relationshipTransitionEngine.js)
 * Evaluates the relationship between 2 adjacent scenes (before_after, continuation, contrast, reveal, explanation)
 * to decide intentional transitions without relying on Gemini random output.
 */

const { TRANSITION_GRAMMAR_RULES } = require("./transitionGrammar");

const RELATIONSHIP_TRANSITIONS = {
  before_after: {
    rule: "speed_match",
    duration: 0.2,
    description: "Nối 2 cảnh Trước & Sau bằng nhịp tua giật",
  },
  continuation: {
    rule: "zoom_match",
    duration: 0.2,
    description: "Nối 2 cảnh cùng dòng chảy bằng nhịp Zoom liên tục",
  },
  contrast: {
    rule: "flash_cut",
    duration: 0.12,
    description: "Nối 2 cảnh đối lập bằng cú chớp sáng nhẹ",
  },
  reveal: {
    rule: "motion_match",
    duration: 0.15,
    description: "Nối 2 cảnh Reveal bằng cú gạt vệt mờ",
  },
  default: {
    rule: "hard_cut",
    duration: 0.0,
    description: "Cắt thẳng 0s liền mạch (Default)",
  },
};

/**
 * Resolves transition between scene A and scene B based on their relationship.
 * @param {Object} sceneA 
 * @param {Object} sceneB 
 * @returns {Object} Transition rule
 */
function resolveRelationshipTransition(sceneA, sceneB) {
  if (!sceneA || !sceneB) return TRANSITION_GRAMMAR_RULES.hard_cut;

  const relationship = String(
    sceneA.scene_relationship || sceneB.scene_relationship || ""
  ).toLowerCase().trim();

  if (relationship.includes("before_after") || relationship.includes("compare")) {
    return TRANSITION_GRAMMAR_RULES.speed_match;
  }

  if (relationship.includes("continuation") || (sceneA.focus === "product" && sceneB.focus === "texture")) {
    return TRANSITION_GRAMMAR_RULES.zoom_match;
  }

  if (relationship.includes("contrast") || relationship.includes("impact")) {
    return TRANSITION_GRAMMAR_RULES.flash_cut;
  }

  if (relationship.includes("reveal")) {
    return TRANSITION_GRAMMAR_RULES.motion_match;
  }

  // Default: Clean Hard Cut 0s
  return TRANSITION_GRAMMAR_RULES.hard_cut;
}

module.exports = {
  RELATIONSHIP_TRANSITIONS,
  resolveRelationshipTransition,
};
