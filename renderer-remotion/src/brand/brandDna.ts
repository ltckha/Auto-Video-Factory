import { staticFile } from "remotion";

export type PlatformType = "tiktok" | "reels" | "shorts" | "facebook" | "general";

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
 * STRICT BRAND INTEGRITY RULES:
 * 1. Tuyệt đối KHÔNG tự ý bịa đặt tên thương hiệu hay vẽ giả mạo logo.
 * 2. Chỉ hiển thị Logo chính thức khi dự án được xác định CHÍNH XÁC 100% thuộc thương hiệu đó.
 * 3. Nếu video không xác định được thương hiệu hoặc là video tổng quát -> Giữ 100% video sạch, KHÔNG chèn logo bừa bãi.
 */
export const BRAND_PROFILES: Record<string, BrandDnaProfile> = {
  yen_leather: {
    id: "yen_leather",
    name: "Yen Handmade Leather",
    officialFullName: "Yen HANDMADE LEATHER",
    logoAssetPath: "brand/assets/logo_yen_handmade_leather.png",
    tone: ["authentic", "handcrafted", "premium", "calm", "tactile"],
    visualPriority: "craftsmanship > decoration",
    defaultStyle: "asmr_craft",
    energyMultiplier: 0.85, // Calm, restrained motion
    typographyModifier: {
      fontWeight: 800,
    },
  },
  hai_nancy: {
    id: "hai_nancy",
    name: "Hiệu Giày Hải Nancy",
    officialFullName: "Hiệu Giày Hải Nancy",
    logoAssetPath: "brand/assets/logo_hai_nancy.png",
    tone: ["reputable", "clean", "accessible", "professional"],
    visualPriority: "clarity & trust",
    defaultStyle: "product_commercial",
    energyMultiplier: 0.95,
  },
  dalat_travel: {
    id: "dalat_travel",
    name: "Đà Lạt Discovery",
    officialFullName: "YenYen Farm & Dalat Nature",
    tone: ["cinematic", "calm", "spacious", "atmospheric"],
    visualPriority: "scenery is the hero",
    defaultStyle: "cinematic_travel",
    energyMultiplier: 0.75,
    typographyModifier: {
      letterSpacingAdd: "1.0px",
    },
  },
  generic_viral: {
    id: "generic_viral",
    name: "Generic Content",
    officialFullName: "",
    logoAssetPath: undefined, // Không có logo
    tone: ["high_energy", "impact", "conversion"],
    visualPriority: "retention & punch",
    defaultStyle: "viral_tiktok",
    energyMultiplier: 1.15,
  },
};

/**
 * Resolver xác thực thương hiệu an toàn (Safe Brand Resolver)
 * Trả về null nếu không xác định được chính xác thương hiệu để tránh chèn nhầm!
 */
export function resolveBrandSafely(contextText: string): BrandDnaProfile | null {
  const lower = (contextText || "").toLowerCase();

  // Kiểm tra Yen Handmade Leather
  if (lower.includes("yen handmade") || lower.includes("yên handmade") || lower.includes("yen leather") || lower.includes("yên leather")) {
    return BRAND_PROFILES.yen_leather;
  }

  // Kiểm tra Hiệu Giày Hải Nancy
  if (lower.includes("hải nancy") || lower.includes("hai nancy") || lower.includes("giày nancy") || lower.includes("hiệu giày hải nancy")) {
    return BRAND_PROFILES.hai_nancy;
  }

  // Nếu không xác định chính xác -> Trả về null (KHÔNG TỰ Ý CHÈN BRAND)
  return null;
}
