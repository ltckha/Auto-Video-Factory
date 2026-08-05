/**
 * Intent-to-Effect Mapper Engine
 * Maps high-level editorial intents (e.g. emphasize_product_quality, hook_attention)
 * into a synchronized Micro-Effect Combo Stack.
 * 
 * 🔒 Built with ZERO-REGRESSION Fallback: Legacy JSON timelines lacking `editorial_intent`
 * automatically fallback to 1:1 standard rendering without breaking!
 */

const { getMicroEffect } = require("./microEffects");

const INTENT_MAPPER_REGISTRY = {
  // 1. Hook 3s Mở đầu giật gân
  hook_attention: {
    intent: "hook_attention",
    description: "Gây chú ý cực mạnh ở 3s đầu",
    comboStack: {
      microEffect: "punch_zoom",
      impactEffect: "flash_white",
      textBehavior: "pop_overshoot",
      textStyle: "hook_bold",
      textPosition: "center",
    },
  },

  // 2. Điểm nhấn sản phẩm ăn tiền (Đế cao su, quai da bò)
  emphasize_product_quality: {
    intent: "emphasize_product_quality",
    description: "Nhấn mạnh chất lượng chi tiết sản phẩm",
    comboStack: {
      microEffect: "punch_zoom",
      impactEffect: "micro_shake",
      textBehavior: "pop_overshoot",
      textStyle: "framed_card",
      textPosition: "bottom",
    },
  },

  // 3. Tốc độ dồn dập, thử nghiệm thực tế (dẫm chân, thử lực)
  fast_impact_test: {
    intent: "fast_impact_test",
    description: "Tạo lực thử nghiệm sản phẩm dồn dập",
    comboStack: {
      microEffect: "speed_ramp",
      impactEffect: "impact_shake",
      textBehavior: "impact_text_bup",
      textStyle: "neon_glow",
      textPosition: "bottom",
    },
  },

  // 4. Giá tiền, Khuyến mãi & Lời kêu gọi mua ngay (CTA)
  call_to_action_sale: {
    intent: "call_to_action_sale",
    description: "Kêu gọi mua hàng / Đánh vào giá tốt",
    comboStack: {
      microEffect: "micro_zoom",
      impactEffect: "flash_white",
      textBehavior: "pop_overshoot",
      textStyle: "cta_red",
      textPosition: "center",
    },
  },

  // 5. Review điềm tĩnh, sang trọng (Fallback cho đồ da cao cấp)
  cinematic_review: {
    intent: "cinematic_review",
    description: "Review chi tiết sang trọng điềm tĩnh",
    comboStack: {
      microEffect: "slow_push",
      impactEffect: null,
      textBehavior: "word_highlight",
      textStyle: "gold_caption",
      textPosition: "bottom",
    },
  },
};

/**
 * Resolves a scene's editorial intent or legacy effect into a renderable Effect Combo Stack.
 * @param {Object} scene - Timeline scene object
 * @returns {Object} Combo stack containing microEffect, impactEffect, textBehavior, textStyle, textPosition
 */
function resolveSceneEffectStack(scene) {
  if (!scene) return null;

  const intent = scene.editorial_intent || (scene.semantic && scene.semantic.intent);

  // Nếu có editorial_intent -> Ánh xạ sang Combo Stack Mới!
  if (intent && INTENT_MAPPER_REGISTRY[intent]) {
    const entry = INTENT_MAPPER_REGISTRY[intent];
    return {
      ...entry.comboStack,
      intent: entry.intent,
      isMicroCombo: true,
    };
  }

  // FALLBACK AN TOÀN CHO HỆ THỐNG CŨ (Legacy Effect Fallback)
  const legacyStyle = scene.subtitle_style || scene.subtitleStyle || "framed_card";
  const legacyPosition = scene.text_position || scene.textPosition || "bottom";
  const legacyEffect = scene.advanced_effect?.name || scene.text_effect || "slow_zoom";

  return {
    microEffect: legacyEffect,
    impactEffect: null,
    textBehavior: "word_highlight",
    textStyle: legacyStyle,
    textPosition: legacyPosition,
    intent: "legacy_fallback",
    isMicroCombo: false,
  };
}

module.exports = {
  INTENT_MAPPER_REGISTRY,
  resolveSceneEffectStack,
};
