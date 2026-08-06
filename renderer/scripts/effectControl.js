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
   * Evaluates requested effects and returns allowed effects or fallbacks.
   * Enforces Rule 2: Single Primary Subtitle Style throughout video,
   * allowing vibrant_yellow_lightning_sticker or warning_red_badge for the final scene.
   */
  processSceneEffects(sceneId, requestedStyle = {}, requestedEffect = {}, isFinalScene = false) {
    let style = typeof requestedStyle === "string" ? requestedStyle : requestedStyle.name || "vibrant_yellow_sticker";
    let textEffect = typeof requestedEffect === "string" ? requestedEffect : requestedEffect.name || "Pop-up";

    // 1. Establish Primary Style for video cohesion
    if (!this.primaryStyle) {
      this.primaryStyle = style;
    }

    if (isFinalScene) {
      // Outro accent rule: Allow vibrant_yellow_lightning_sticker, warning_red_badge, cta_red or primaryStyle
      const allowedOutroStyles = ["vibrant_yellow_lightning_sticker", "gold_caption", "warning_red_badge", "cta_red", this.primaryStyle];
      if (!allowedOutroStyles.includes(style)) {
        style = "vibrant_yellow_lightning_sticker";
      }
    } else {
      // Body scenes: Enforce video-wide primary style cohesion
      style = this.primaryStyle;
    }

    // 2. Check Cooldown rule for text animation effect (Typewriter vs Pop-up)
    const recentHistory = this.history.slice(-COOLDOWN_SCENES);
    const lastTextEffect = recentHistory.length > 0 ? recentHistory[recentHistory.length - 1].textEffect : null;

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

module.exports = EffectControlManager;
module.exports.EffectControlManager = EffectControlManager;
