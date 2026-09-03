export interface BrandDnaProfile {
  id: string;
  name: string;
  officialFullName: string;
  logoAssetPath?: string;
  tone: string[];
  visualPriority: string;
  defaultStyle: string;
  energyMultiplier: number;
  typographyModifier?: {
    letterSpacingAdd?: string;
    fontWeight?: number;
  };
}

/**
 * STRICT BRAND INTEGRITY RULES (9 OFFICIAL BRANDS):
 * 1. Tuyệt đối KHÔNG tự ý bịa đặt tên thương hiệu hay vẽ giả mạo logo.
 * 2. Chỉ hiển thị Logo chính thức khi dự án được xác định CHÍNH XÁC 100% thuộc thương hiệu đó.
 * 3. Nếu video không xác định được thương hiệu hoặc là video tổng quát -> Giữ 100% video sạch, KHÔNG chèn logo bừa bãi.
 */
export const BRAND_PROFILES: Record<string, BrandDnaProfile> = {
  hieu_giay_hai_nancy: {
    id: "hieu_giay_hai_nancy",
    name: "Hiệu Giày Hải Nancy",
    officialFullName: "Hiệu Giày Hải Nancy",
    logoAssetPath: "brand/assets/logo_hai_nancy.png",
    tone: ["reputable", "clean", "craft", "formal", "professional"],
    visualPriority: "clarity & trust",
    defaultStyle: "product_commercial",
    energyMultiplier: 0.95,
  },
  yen_handmade_leather: {
    id: "yen_handmade_leather",
    name: "Yen Handmade Leather",
    officialFullName: "Yen HANDMADE LEATHER",
    logoAssetPath: "brand/assets/logo_yen_handmade_leather.png",
    tone: ["authentic", "handcrafted", "premium", "calm", "tactile"],
    visualPriority: "craftsmanship > decoration",
    defaultStyle: "asmr_craft",
    energyMultiplier: 0.85,
    typographyModifier: {
      fontWeight: 800,
    },
  },
  mua_chuan_xai_lau: {
    id: "mua_chuan_xai_lau",
    name: "Mua Chuẩn Xài Lâu",
    officialFullName: "Mua Chuẩn Xài Lâu",
    tone: ["durable", "honest", "review", "practical", "tech"],
    visualPriority: "product durability & practical value",
    defaultStyle: "tactile_tech_unboxing_accessory_asmr",
    energyMultiplier: 1.0,
  },
  yenyen_deals: {
    id: "yenyen_deals",
    name: "YenYen Deals",
    officialFullName: "YenYen Deals",
    tone: ["high_energy", "deal", "smart_shopping", "affiliate"],
    visualPriority: "hot price & smart buying",
    defaultStyle: "viral_tiktok",
    energyMultiplier: 1.15,
  },
  macadamia_hai_nancy: {
    id: "macadamia_hai_nancy",
    name: "Macadamia Hải Nancy",
    officialFullName: "Macadamia Hải Nancy",
    tone: ["natural", "organic", "healthy", "premium_gift"],
    visualPriority: "natural freshness & quality",
    defaultStyle: "product_commercial",
    energyMultiplier: 0.90,
  },
  o_da_lat_vay_thoi: {
    id: "o_da_lat_vay_thoi",
    name: "Ờ Đà Lạt vậy thôi",
    officialFullName: "Ờ Đà Lạt vậy thôi",
    tone: ["cinematic", "calm", "chill", "coffee", "travel"],
    visualPriority: "scenery & atmospheric chill",
    defaultStyle: "cinematic_travel",
    energyMultiplier: 0.75,
    typographyModifier: {
      letterSpacingAdd: "1.0px",
    },
  },
  elegant_steps: {
    id: "elegant_steps",
    name: "Elegant Steps",
    officialFullName: "Elegant Steps",
    tone: ["fashionable", "graceful", "lifestyle", "chic"],
    visualPriority: "style & gait elegance",
    defaultStyle: "dynamic_loafer_showcase",
    energyMultiplier: 1.05,
  },
  yenyen_farm: {
    id: "yenyen_farm",
    name: "YenYen Farm",
    officialFullName: "YenYen Farm",
    tone: ["earthy", "organic", "fresh", "farmstead"],
    visualPriority: "soil & harvest purity",
    defaultStyle: "lifestyle",
    energyMultiplier: 0.85,
  },
  yenyen_forest_farm: {
    id: "yenyen_forest_farm",
    name: "YenYen Forest Farm",
    officialFullName: "YenYen Forest Farm",
    tone: ["deep_forest", "herbal", "healing", "ecological"],
    visualPriority: "forest canopy & herbal tranquility",
    defaultStyle: "cinematic_travel",
    energyMultiplier: 0.80,
  },
  general: {
    id: "general",
    name: "General Content",
    officialFullName: "",
    logoAssetPath: undefined,
    tone: ["dynamic", "viral", "creative"],
    visualPriority: "retention & engagement",
    defaultStyle: "viral_tiktok",
    energyMultiplier: 1.0,
  },
};

// Aliases for backward compatibility
BRAND_PROFILES.hai_nancy = BRAND_PROFILES.hieu_giay_hai_nancy;
BRAND_PROFILES.yen_leather = BRAND_PROFILES.yen_handmade_leather;
BRAND_PROFILES.dalat_travel = BRAND_PROFILES.o_da_lat_vay_thoi;
BRAND_PROFILES.generic_viral = BRAND_PROFILES.general;

/**
 * Resolver xác thực thương hiệu an toàn (Safe Brand Resolver)
 * Trả về null nếu không xác định được chính xác thương hiệu để tránh chèn nhầm!
 */
export function resolveBrandSafely(contextText: string): BrandDnaProfile | null {
  const lower = (contextText || "").toLowerCase();

  if (lower.includes("hải nancy") || lower.includes("hai nancy") || lower.includes("giày nancy") || lower.includes("hieu_giay_hai_nancy")) {
    return BRAND_PROFILES.hieu_giay_hai_nancy;
  }
  if (lower.includes("yen handmade") || lower.includes("yên handmade") || lower.includes("yen leather") || lower.includes("yen_handmade_leather")) {
    return BRAND_PROFILES.yen_handmade_leather;
  }
  if (lower.includes("mua chuẩn xài lâu") || lower.includes("mua_chuan_xai_lau") || lower.includes("chuan xai lau")) {
    return BRAND_PROFILES.mua_chuan_xai_lau;
  }
  if (lower.includes("yenyen deals") || lower.includes("yenyen_deals") || lower.includes("săn deal")) {
    return BRAND_PROFILES.yenyen_deals;
  }
  if (lower.includes("macadamia") || lower.includes("mắc ca") || lower.includes("macca")) {
    return BRAND_PROFILES.macadamia_hai_nancy;
  }
  if (lower.includes("đà lạt") || lower.includes("da lat") || lower.includes("o_da_lat_vay_thoi")) {
    return BRAND_PROFILES.o_da_lat_vay_thoi;
  }
  if (lower.includes("elegant steps") || lower.includes("elegant_steps")) {
    return BRAND_PROFILES.elegant_steps;
  }
  if (lower.includes("forest farm") || lower.includes("yenyen_forest_farm")) {
    return BRAND_PROFILES.yenyen_forest_farm;
  }
  if (lower.includes("yenyen farm") || lower.includes("yenyen_farm")) {
    return BRAND_PROFILES.yenyen_farm;
  }

  return null;
}
