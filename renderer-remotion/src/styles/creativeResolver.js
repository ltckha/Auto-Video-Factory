const STYLE_REGISTRY = {
  asmr_craft: { id: "asmr_craft", card: { type: "glass" }, camera: { defaultMotion: "macro_push" } },
  viral_tiktok: { id: "viral_tiktok", card: { type: "sticker" }, camera: { defaultMotion: "punch_zoom" } },
  luxury_editorial: { id: "luxury_editorial", card: { type: "editorial" }, camera: { defaultMotion: "drift_cam" } },
  cinematic_travel: { id: "cinematic_travel", card: { type: "glass" }, camera: { defaultMotion: "drift_cam" } },
  food_social: { id: "food_social", card: { type: "glass" }, camera: { defaultMotion: "macro_push" } },
  product_commercial: { id: "product_commercial", card: { type: "badge" }, camera: { defaultMotion: "snap_zoom" } },
};

const BRAND_PROFILES = {
  yen_leather: {
    id: "yen_leather",
    name: "YEN Leather",
    defaultStyle: "asmr_craft",
    energyMultiplier: 0.85,
  },
  hai_nancy: {
    id: "hai_nancy",
    name: "Hải Nancy",
    defaultStyle: "product_commercial",
    energyMultiplier: 0.95,
  },
  dalat_travel: {
    id: "dalat_travel",
    name: "Đà Lạt Discovery",
    defaultStyle: "cinematic_travel",
    energyMultiplier: 0.75,
  },
  generic_viral: {
    id: "generic_viral",
    name: "Viral Social Factory",
    defaultStyle: "viral_tiktok",
    energyMultiplier: 1.15,
  },
};

function sanitizeText(input) {
  if (input === null || input === undefined) return "";
  const str = String(input);
  const cleanHtml = str.replace(/<[^>]*>?/gm, "");
  return cleanHtml.replace(/\s+/g, " ").trim();
}

function normalizeSearchText(input) {
  const clean = sanitizeText(input).toLowerCase();
  return clean.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "d");
}

function resolveCreativeSpecification(input = {}) {
  const platform = input?.platform || "tiktok";
  const brandKey = input?.brand || "yen_leather";
  const brand = BRAND_PROFILES[brandKey] || BRAND_PROFILES.yen_leather;

  const title = sanitizeText(input?.content?.title);
  const hashtags = Array.isArray(input?.content?.hashtags)
    ? input.content.hashtags.map(sanitizeText).filter(Boolean)
    : [];
  const pipelineMode = sanitizeText(input?.content?.pipeline_mode);

  let rawStyle = String(input?.intent?.style || "").toLowerCase().trim();
  let styleKey = "";

  if (rawStyle && STYLE_REGISTRY[rawStyle]) {
    styleKey = rawStyle;
  } else {
    const textCorpus = [
      normalizeSearchText(title),
      ...hashtags.map(normalizeSearchText),
      normalizeSearchText(pipelineMode),
    ].join(" ");

    if (textCorpus.includes("nhuom") || textCorpus.includes("phuc hoi") || textCorpus.includes("asmr") || textCorpus.includes("craft") || textCorpus.includes("ve sinh") || textCorpus.includes("thu cong") || textCorpus.includes("giay")) {
      styleKey = "asmr_craft";
    } else if (textCorpus.includes("dalat") || textCorpus.includes("travel") || textCorpus.includes("dji") || textCorpus.includes("du lich")) {
      styleKey = "cinematic_travel";
    } else if (textCorpus.includes("luxury") || textCorpus.includes("boots") || textCorpus.includes("vogue")) {
      styleKey = "luxury_editorial";
    } else if (textCorpus.includes("viral") || textCorpus.includes("bien hinh") || textCorpus.includes("transformation")) {
      styleKey = "viral_tiktok";
    } else if (textCorpus.includes("food") || textCorpus.includes("nau an") || textCorpus.includes("mon ngon")) {
      styleKey = "food_social";
    } else {
      styleKey = brand.defaultStyle || "asmr_craft";
    }
  }

  const baseToken = STYLE_REGISTRY[styleKey] || STYLE_REGISTRY.asmr_craft;
  const token = JSON.parse(JSON.stringify(baseToken));

  let rawEnergy = Number(input?.intent?.energy);
  if (isNaN(rawEnergy)) {
    rawEnergy = 0.65;
  }
  const normalizedEnergy = Math.max(0.0, Math.min(1.0, rawEnergy));

  let platformMultiplier = 1.0;
  if (platform === "tiktok" || platform === "instagram_reels") {
    platformMultiplier = 1.25;
  } else if (platform === "facebook") {
    platformMultiplier = 0.80;
  }

  const brandMultiplier = brand.energyMultiplier || 1.0;
  const finalIntensity = Number(
    Math.min(1.0, Math.max(0.1, normalizedEnergy * brandMultiplier * platformMultiplier)).toFixed(2)
  );

  return {
    token,
    intensity: finalIntensity,
    brand,
    platform,
  };
}

module.exports = {
  resolveCreativeSpecification,
  sanitizeText,
  normalizeSearchText,
  BRAND_PROFILES,
  STYLE_REGISTRY,
};
