/**
 * Style DNA Engine (Priority 5) - CapCut / TikTok 2026 Trend
 * Defines holistic visual DNA parameters for different content niches.
 */

const STYLE_DNA_PROFILES = {
  TIKTOK_VIRAL_FAST: {
    dna_id: "TIKTOK_VIRAL_FAST",
    name: "TikTok Bán Hàng Năng Lượng Cao (Affiliate Sales / Sneaker Unboxing)",
    cut_frequency: 0.90,
    transition_frequency: 0.10,
    text_motion: 0.85,
    zoom_frequency: 0.75,
    shake_frequency: 0.35,
    flash_frequency: 0.20,
    beat_sync: 0.90,
    velocity: 0.80,
    caption_density: 0.85,
    defaultStyle: "hook_bold",
    defaultPacing: "fast_impact",
  },

  LUXURY_LEATHER: {
    dna_id: "LUXURY_LEATHER",
    name: "Đồ Da Sang Trọng / Thần Thái Thư Thái (Luxury Shoes & Leather Craft)",
    cut_frequency: 0.35,
    transition_frequency: 0.05,
    text_motion: 0.30,
    zoom_frequency: 0.55,
    shake_frequency: 0.02,
    flash_frequency: 0.05,
    beat_sync: 0.30,
    velocity: 0.20,
    caption_density: 0.50,
    defaultStyle: "gold_caption",
    defaultPacing: "cinematic_slow",
  },

  UGC_REVIEW: {
    dna_id: "UGC_REVIEW",
    name: "Review Chân Thực Người Dùng (UGC / Mẹo Dùng Dép)",
    cut_frequency: 0.65,
    transition_frequency: 0.08,
    text_motion: 0.80,
    zoom_frequency: 0.40,
    shake_frequency: 0.15,
    flash_frequency: 0.10,
    beat_sync: 0.50,
    velocity: 0.40,
    caption_density: 0.75,
    defaultStyle: "framed_card",
    defaultPacing: "medium_smooth",
  },
};

function resolveStyleDna(categoryOrNiche) {
  if (!categoryOrNiche) return STYLE_DNA_PROFILES.TIKTOK_VIRAL_FAST;

  const key = String(categoryOrNiche).toLowerCase().trim();
  if (key.includes("leather") || key.includes("luxury") || key.includes("craft") || key.includes("fashion_lifestyle")) {
    return STYLE_DNA_PROFILES.LUXURY_LEATHER;
  }

  if (key.includes("ugc") || key.includes("review") || key.includes("diy") || key.includes("food")) {
    return STYLE_DNA_PROFILES.UGC_REVIEW;
  }

  return STYLE_DNA_PROFILES.TIKTOK_VIRAL_FAST;
}

module.exports = {
  STYLE_DNA_PROFILES,
  resolveStyleDna,
};
