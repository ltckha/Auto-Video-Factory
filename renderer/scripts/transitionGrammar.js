/**
 * Transition Grammar Engine (CapCut / TikTok 2026 Trend)
 * Eliminates random PowerPoint shape transitions (circle_open, slide_up, wipe_left).
 * Implements 5 intentional transition rules.
 */

const TRANSITION_GRAMMAR_RULES = {
  hard_cut: {
    type: "hard_cut",
    duration: 0.0,
    description: "Cắt thẳng 0s không dùng hiệu ứng (Default 70% scenes)",
  },
  flash_cut: {
    type: "flash_white",
    duration: 0.12,
    description: "Cắt cảnh kèm cú chớp sáng 120ms đúng nốt chuyển",
  },
  zoom_match: {
    type: "zoom_in",
    duration: 0.2,
    description: "Nối 2 cảnh bằng cùng nhịp zoom liên tục",
  },
  motion_match: {
    type: "whip_left",
    duration: 0.15,
    description: "Nối 2 cảnh bằng cú gạt vệt mờ siêu tốc",
  },
  speed_match: {
    type: "speed_ramp",
    duration: 0.2,
    description: "Nối 2 cảnh bằng cùng nhịp tua Velocity",
  },
};

/**
 * Resolves a raw transition request into a clean, intentional transition rule.
 * Eliminates obsolete PowerPoint transitions (circle_open, slide_up, etc).
 * @param {string|Object} rawTransition 
 * @returns {Object} Clean transition rule
 */
function resolveTransitionRule(rawTransition) {
  if (!rawTransition) return TRANSITION_GRAMMAR_RULES.hard_cut;

  const type = typeof rawTransition === "string" 
    ? rawTransition.toLowerCase().trim() 
    : String(rawTransition.type || "").toLowerCase().trim();

  // BỎ HOÀN TOÀN CÁC CHUYỂN CẢNH NGỨA MẮT (circle_open, slide_up, wipe_left ngẫu nhiên)
  if (type.includes("circle") || type.includes("slide") || type.includes("wipe")) {
    return TRANSITION_GRAMMAR_RULES.hard_cut;
  }

  if (type.includes("flash") || type.includes("blink")) {
    return TRANSITION_GRAMMAR_RULES.flash_cut;
  }

  if (type.includes("zoom")) {
    return TRANSITION_GRAMMAR_RULES.zoom_match;
  }

  if (type.includes("motion") || type.includes("whip")) {
    return TRANSITION_GRAMMAR_RULES.motion_match;
  }

  if (type.includes("speed") || type.includes("velocity")) {
    return TRANSITION_GRAMMAR_RULES.speed_match;
  }

  if (type.includes("fade") || type.includes("dissolve")) {
    return { type: "fade", duration: 0.25, description: "Mờ dần nhẹ nhàng" };
  }

  return TRANSITION_GRAMMAR_RULES.hard_cut;
}

module.exports = {
  TRANSITION_GRAMMAR_RULES,
  resolveTransitionRule,
};
