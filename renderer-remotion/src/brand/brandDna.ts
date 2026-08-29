export interface BrandDnaProfile {
  id: string;
  name: string;
  tone: string[];
  visualPriority: string;
  defaultStyle: string;
  energyMultiplier: number;
  typographyModifier?: {
    letterSpacingAdd?: string;
    fontWeight?: number;
  };
}

export const BRAND_PROFILES: Record<string, BrandDnaProfile> = {
  yen_leather: {
    id: "yen_leather",
    name: "YEN Leather",
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
    name: "Hải Nancy",
    tone: ["reputable", "clean", "accessible", "professional"],
    visualPriority: "clarity & trust",
    defaultStyle: "product_commercial",
    energyMultiplier: 0.95,
  },
  dalat_travel: {
    id: "dalat_travel",
    name: "Đà Lạt Discovery",
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
    name: "Viral Social Factory",
    tone: ["high_energy", "impact", "conversion"],
    visualPriority: "retention & punch",
    defaultStyle: "viral_tiktok",
    energyMultiplier: 1.15,
  },
};
