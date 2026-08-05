/**
 * Effect Budget & Cooldown Control Engine (Priority 6) - CapCut / TikTok 2026 Trend
 * Manages per-video effect quotas and enforces same-effect cooldown memory to prevent AI effect overdose.
 */

class EffectController {
  constructor(options = {}) {
    this.maxFlashCount = options.maxFlashCount || 3;
    this.maxShakeCount = options.maxShakeCount || 4;
    this.maxPunchZoomCount = options.maxPunchZoomCount || 5;

    this.currentFlashCount = 0;
    this.currentShakeCount = 0;
    this.currentPunchZoomCount = 0;

    this.effectHistory = []; // Tracks recent effect names per scene
    this.cooldownScenes = options.cooldownScenes || 2;
  }

  /**
   * Checks if an effect can be applied based on quota and cooldown.
   * @param {string} effectName 
   * @param {number} sceneIndex 
   * @returns {boolean} True if allowed, false if budget exceeded or in cooldown
   */
  canApplyEffect(effectName, sceneIndex) {
    if (!effectName) return true;
    const name = String(effectName).toLowerCase().trim();

    // 1. Check Cooldown Memory (same_effect_cooldown = 2 scenes)
    const recentHistory = this.effectHistory.slice(-this.cooldownScenes);
    if (recentHistory.includes(name)) {
      return false; // In cooldown! Fallback to clean hard cut or basic zoom
    }

    // 2. Check Quota Budget
    if (name.includes("flash")) {
      if (this.currentFlashCount >= this.maxFlashCount) return false;
    }

    if (name.includes("shake")) {
      if (this.currentShakeCount >= this.maxShakeCount) return false;
    }

    if (name.includes("punch_zoom")) {
      if (this.currentPunchZoomCount >= this.maxPunchZoomCount) return false;
    }

    return true;
  }

  /**
   * Records an applied effect.
   * @param {string} effectName 
   * @param {number} sceneIndex 
   */
  recordEffect(effectName, sceneIndex) {
    if (!effectName) return;
    const name = String(effectName).toLowerCase().trim();

    this.effectHistory.push(name);

    if (name.includes("flash")) this.currentFlashCount++;
    if (name.includes("shake")) this.currentShakeCount++;
    if (name.includes("punch_zoom")) this.currentPunchZoomCount++;
  }
}

module.exports = {
  EffectController,
};
