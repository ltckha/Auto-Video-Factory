/**
 * Effect Recipes & Combo Stack Registry (CapCut / TikTok 2026 Trend)
 * Pre-packaged synchronized multi-layered combos instead of isolated single effects.
 */

const EFFECT_RECIPES = {
  HOOK_ATTACK: {
    recipe_id: "HOOK_ATTACK",
    name: "Hook Giật Gân 3s Mở Đầu",
    combo: {
      microEffect: "punch_zoom",
      impactEffect: "micro_shake",
      textBehavior: "pop_overshoot",
      textStyle: "hook_bold",
      textPosition: "center",
      transitionOut: "flash_cut",
    },
  },

  PRODUCT_REVEAL: {
    recipe_id: "PRODUCT_REVEAL",
    name: "Show Chi Tiết Sản Phẩm Đắt Giá",
    combo: {
      microEffect: "punch_zoom",
      impactEffect: "micro_shake",
      textBehavior: "pop_overshoot",
      textStyle: "framed_card",
      textPosition: "bottom",
      transitionOut: "hard_cut",
    },
  },

  PRICE_REVEAL: {
    recipe_id: "PRICE_REVEAL",
    name: "Báo Giá & Ưu Đãi Đột Phá",
    combo: {
      microEffect: "freeze_frame",
      impactEffect: "flash_white",
      textBehavior: "impact_text_bup",
      textStyle: "cta_red",
      textPosition: "center",
      transitionOut: "hard_cut",
    },
  },

  BEFORE_AFTER_SNAP: {
    recipe_id: "BEFORE_AFTER_SNAP",
    name: "So Sánh Trước & Sau Siêu Lực",
    combo: {
      microEffect: "speed_ramp",
      impactEffect: "impact_shake",
      textBehavior: "pop_overshoot",
      textStyle: "neon_glow",
      textPosition: "bottom",
      transitionOut: "flash_cut",
    },
  },

  CTA_REVEAL: {
    recipe_id: "CTA_REVEAL",
    name: "Kết Bài Kêu Gọi Mua Hàng / Lưu Bài",
    combo: {
      microEffect: "slow_push",
      impactEffect: "flash_white",
      textBehavior: "word_highlight",
      textStyle: "cta_red",
      textPosition: "bottom",
      transitionOut: "hard_cut",
    },
  },
};

/**
 * Gets an effect recipe by ID or resolves from intent
 * @param {string} recipeIdOrIntent 
 * @returns {Object} Recipe combo
 */
function getEffectRecipe(recipeIdOrIntent) {
  if (!recipeIdOrIntent) return null;
  const key = String(recipeIdOrIntent).toUpperCase().trim();
  if (EFFECT_RECIPES[key]) return EFFECT_RECIPES[key].combo;

  // Fallback mappings
  if (key.includes("HOOK")) return EFFECT_RECIPES.HOOK_ATTACK.combo;
  if (key.includes("PRODUCT") || key.includes("EMPHASIZE")) return EFFECT_RECIPES.PRODUCT_REVEAL.combo;
  if (key.includes("PRICE") || key.includes("SALE")) return EFFECT_RECIPES.PRICE_REVEAL.combo;
  if (key.includes("BEFORE") || key.includes("TEST")) return EFFECT_RECIPES.BEFORE_AFTER_SNAP.combo;
  if (key.includes("CTA") || key.includes("OUTRO")) return EFFECT_RECIPES.CTA_REVEAL.combo;

  return null;
}

module.exports = {
  EFFECT_RECIPES,
  getEffectRecipe,
};
