/**
 * Architectural Layer 1: Style Director (styleDirector.js)
 * Master High-Level Orchestrator for Auto-Video-Factory v9.5
 * Manages Style DNA Profiles, Visual Fatigue Score, Effect Budget Quotas, and Cooldown Memory.
 */

const STYLE_DNA_PROFILES = {
  TIKTOK_VIRAL_FAST: {
    dna_id: "TIKTOK_VIRAL_FAST",
    name: "TikTok Bán Hàng Năng Lượng Cao (Affiliate Sales / Unboxing)",
    cut_frequency: 0.90,
    transition_frequency: 0.10,
    text_motion: 0.85,
    keyword_emphasis: 0.85,
    caption_density: 0.85,
    impact_frequency: 0.25,
    camera_motion: 0.75,
    beat_sync: 0.90,
    velocity: 0.80,
    targetAllocation: { base: 0.55, emphasis: 0.30, impact: 0.15 },
    defaultPersonality: "SOCIAL_PUNCH",
  },

  LUXURY_LEATHER: {
    dna_id: "LUXURY_LEATHER",
    name: "Đồ Da Sang Trọng / Thần Thái Thư Thái (Luxury Leather & Shoes)",
    cut_frequency: 0.35,
    transition_frequency: 0.05,
    text_motion: 0.30,
    keyword_emphasis: 0.40,
    caption_density: 0.50,
    impact_frequency: 0.03,
    camera_motion: 0.40,
    beat_sync: 0.30,
    velocity: 0.20,
    targetAllocation: { base: 0.85, emphasis: 0.14, impact: 0.01 },
    defaultPersonality: "EDITORIAL_LUXURY",
  },

  UGC_REVIEW: {
    dna_id: "UGC_REVIEW",
    name: "Review Chân Thực Người Dùng (UGC / Mẹo Dùng Dép)",
    cut_frequency: 0.65,
    transition_frequency: 0.08,
    text_motion: 0.70,
    keyword_emphasis: 0.75,
    caption_density: 0.75,
    impact_frequency: 0.10,
    camera_motion: 0.45,
    beat_sync: 0.50,
    velocity: 0.40,
    targetAllocation: { base: 0.70, emphasis: 0.25, impact: 0.05 },
    defaultPersonality: "CLEAN_KINETIC",
  },
};

class StyleDirector {
  constructor(options = {}) {
    const category = options.category || options.niche || "general";
    this.styleDna = this.resolveDnaProfile(category);

    this.maxFlashCount = options.maxFlashCount || 3;
    this.maxShakeCount = options.maxShakeCount || 4;
    this.maxPunchZoomCount = options.maxPunchZoomCount || 5;

    this.currentFlashCount = 0;
    this.currentShakeCount = 0;
    this.currentPunchZoomCount = 0;

    this.cooldownScenes = options.cooldownScenes || 2;
    this.effectHistory = [];

    this.fatigueScore = 0.0; // Visual Fatigue Score (0.0 to 1.0)
  }

  resolveDnaProfile(category) {
    if (!category) return STYLE_DNA_PROFILES.TIKTOK_VIRAL_FAST;
    const key = String(category).toLowerCase().trim();

    if (key.includes("leather") || key.includes("luxury") || key.includes("craft") || key.includes("fashion_lifestyle")) {
      return STYLE_DNA_PROFILES.LUXURY_LEATHER;
    }

    if (key.includes("ugc") || key.includes("review") || key.includes("diy") || key.includes("food")) {
      return STYLE_DNA_PROFILES.UGC_REVIEW;
    }

    return STYLE_DNA_PROFILES.TIKTOK_VIRAL_FAST;
  }

  /**
   * Computes current Visual Fatigue Score based on applied effects.
   * If fatigueScore > 0.70, suppresses heavy shake/flash to prevent viewer fatigue.
   */
  computeFatigueScore() {
    const totalImpacts = this.currentFlashCount + this.currentShakeCount + this.currentPunchZoomCount;
    this.fatigueScore = Math.min(1.0, totalImpacts * 0.12);
    return this.fatigueScore;
  }

  /**
   * Checks if an effect is allowed by Budget, Cooldown, and Fatigue Score.
   */
  canApplyEffect(effectName, sceneIndex) {
    if (!effectName) return true;
    const name = String(effectName).toLowerCase().trim();

    // Check Cooldown
    const recentHistory = this.effectHistory.slice(-this.cooldownScenes);
    if (recentHistory.includes(name)) return false;

    // Check Visual Fatigue threshold (> 0.70)
    if (this.computeFatigueScore() > 0.70 && (name.includes("flash") || name.includes("shake"))) {
      return false; // Suppress heavy impacts when fatigue is high
    }

    // Check Quota Budget
    if (name.includes("flash") && this.currentFlashCount >= this.maxFlashCount) return false;
    if (name.includes("shake") && this.currentShakeCount >= this.maxShakeCount) return false;
    if (name.includes("punch_zoom") && this.currentPunchZoomCount >= this.maxPunchZoomCount) return false;

    return true;
  }

  recordEffect(effectName) {
    if (!effectName) return;
    const name = String(effectName).toLowerCase().trim();
    this.effectHistory.push(name);

    if (name.includes("flash")) this.currentFlashCount++;
    if (name.includes("shake")) this.currentShakeCount++;
    if (name.includes("punch_zoom")) this.currentPunchZoomCount++;
    this.computeFatigueScore();
  }
}

function resolveStyleDna(categoryOrNiche) {
  const director = new StyleDirector({ category: categoryOrNiche });
  return director.styleDna;
}

module.exports = {
  STYLE_DNA_PROFILES,
  StyleDirector,
  resolveStyleDna,
};
