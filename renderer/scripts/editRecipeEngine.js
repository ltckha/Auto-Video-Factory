/**
 * Architectural Layer 3: Dynamic Edit Recipe Engine (editRecipeEngine.js)
 * Synchronizes Subtitle Choreography + Video Motion + Transitions into coherent recipes.
 * Supports Recipe Variants (aggressive, clean, playful) to prevent repetitive templates.
 */

const DYNAMIC_EDIT_RECIPES = {
  WARNING_HOOK: {
    recipe_id: "WARNING_HOOK",
    intent: "warn",
    rhythm: "hit",
    variants: {
      aggressive: {
        videoMotion: "punch_zoom",
        impactEffect: "micro_shake",
        textBehavior: "impact_bup",
        transitionPreferred: ["flash_cut", "hard_cut"],
      },
      clean: {
        videoMotion: "slow_push",
        impactEffect: null,
        textBehavior: "word_highlight",
        transitionPreferred: ["hard_cut"],
      },
      playful: {
        videoMotion: "micro_zoom",
        impactEffect: "micro_shake",
        textBehavior: "pop_overshoot",
        transitionPreferred: ["hard_cut"],
      },
    },
  },

  PRODUCT_SHOWCASE: {
    recipe_id: "PRODUCT_SHOWCASE",
    intent: "demonstrate",
    rhythm: "accelerate",
    variants: {
      editorial: {
        videoMotion: "slow_push",
        impactEffect: null,
        textBehavior: "word_highlight",
        transitionPreferred: ["zoom_match", "hard_cut"],
      },
      dynamic: {
        videoMotion: "punch_zoom",
        impactEffect: "micro_shake",
        textBehavior: "pop_overshoot",
        transitionPreferred: ["hard_cut"],
      },
    },
  },

  PRICE_DROP_IMPACT: {
    recipe_id: "PRICE_DROP_IMPACT",
    intent: "offer",
    rhythm: "hit",
    variants: {
      massive: {
        videoMotion: "freeze_frame",
        impactEffect: "flash_white",
        textBehavior: "impact_bup",
        transitionPreferred: ["flash_cut", "hard_cut"],
      },
      subtle: {
        videoMotion: "micro_zoom",
        impactEffect: null,
        textBehavior: "pop_overshoot",
        transitionPreferred: ["hard_cut"],
      },
    },
  },

  LUXURY_CRAFT: {
    recipe_id: "LUXURY_CRAFT",
    intent: "prove",
    rhythm: "rest",
    variants: {
      luxury: {
        videoMotion: "slow_push",
        impactEffect: null,
        textBehavior: "word_highlight",
        transitionPreferred: ["hard_cut"],
      },
    },
  },
};

/**
 * Resolves a dynamic edit recipe variant based on intent and visual energy.
 */
function resolveRecipeVariant(visualIntent, energy = 0.5) {
  const intentKey = String(visualIntent || "").toLowerCase();
  let recipe = DYNAMIC_EDIT_RECIPES.PRODUCT_SHOWCASE;

  if (intentKey.includes("warn") || intentKey.includes("hook")) {
    recipe = DYNAMIC_EDIT_RECIPES.WARNING_HOOK;
  } else if (intentKey.includes("price") || intentKey.includes("offer") || intentKey.includes("sale")) {
    recipe = DYNAMIC_EDIT_RECIPES.PRICE_DROP_IMPACT;
  } else if (intentKey.includes("luxury") || intentKey.includes("craft") || intentKey.includes("prove")) {
    recipe = DYNAMIC_EDIT_RECIPES.LUXURY_CRAFT;
  }

  // Pick variant based on energy level
  const variantKey = energy >= 0.8 ? "aggressive" : (energy <= 0.4 ? "clean" : (recipe.variants.dynamic ? "dynamic" : "editorial"));
  const selectedVariant = recipe.variants[variantKey] || recipe.variants.aggressive || recipe.variants.editorial || recipe.variants.luxury || recipe.variants.subtle;

  return {
    recipe_id: recipe.recipe_id,
    variant: variantKey,
    ...selectedVariant,
  };
}

module.exports = {
  DYNAMIC_EDIT_RECIPES,
  resolveRecipeVariant,
};
