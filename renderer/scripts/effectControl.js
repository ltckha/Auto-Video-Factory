/**
 * Effect Budget & Cooldown Control (Auto-Video-Factory)
 * Manages visual effect quota per video and enforces 2-scene cooldown rules to prevent visual fatigue.
 */

const DEFAULT_BUDGET = {
  max_flashes: 3,
  max_shakes: 4,
  max_punch_zooms: 5,
  max_kinetic_pop: 4,
};

const COOLDOWN_SCENES = 2;

class EffectControlManager {
  constructor(customBudget = {}) {
    this.budget = { ...DEFAULT_BUDGET, ...customBudget };
    this.usageCounter = {
      flashes: 0,
      shakes: 0,
      punch_zooms: 0,
      kinetic_pop: 0,
    };
    this.history = []; // History of past scene effects
  }

  /**
   * Evaluates requested effects and returns allowed effects or fallbacks
   */
  processSceneEffects(sceneId, requestedStyle = {}, requestedEffect = {}) {
    let style = typeof requestedStyle === "string" ? requestedStyle : requestedStyle.name || "hook_bold";
    let textEffect = typeof requestedEffect === "string" ? requestedEffect : requestedEffect.name || "Pop-up";

    // 1. Check Cooldown rule (no same style for 2 consecutive scenes)
    const recentHistory = this.history.slice(-COOLDOWN_SCENES);
    const lastStyle = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].style : null;
    const lastTextEffect = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].textEffect : null;

    if (style === lastStyle) {
      // Rotate style to ensure visual variety
      if (style === "hook_bold" || style === "vibrant_yellow_sticker") style = "framed_card";
      else if (style === "framed_card" || style === "minimal_glass_card") style = "gold_caption";
      else style = "vibrant_yellow_sticker";
    }

    if (textEffect === lastTextEffect) {
      textEffect = textEffect === "Typewriter" ? "Pop-up" : "Typewriter";
    }

    // 2. Check Quota Budget for heavy effects
    if (textEffect.toLowerCase().includes("pop") || textEffect.toLowerCase().includes("bounce")) {
      if (this.usageCounter.kinetic_pop >= this.budget.max_kinetic_pop) {
        textEffect = "Typewriter"; // Fallback to smooth typewriter
      } else {
        this.usageCounter.kinetic_pop++;
      }
    }

    // Record scene in history
    this.history.push({
      sceneId,
      style,
      textEffect,
    });

    return {
      style,
      textEffect,
    };
  }
}

module.exports = {
  EffectControlManager,
};
