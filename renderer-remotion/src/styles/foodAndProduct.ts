import { DesignToken } from "./tokens";

export const foodSocialToken: DesignToken = {
  id: "food_social",
  name: "Food & Culinary Social",
  description: "Dành cho nấu ăn, đồ ăn, quán xá, cafe. Tông ấm áp, ngon mắt, viền tròn mềm mại.",
  typography: {
    fontFamily: "'Inter', 'Montserrat', -apple-system, sans-serif",
    baseFontSize: 48,
    longTextFontSize: 38,
    lineHeight: 1.25,
    letterSpacing: "0.5px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  card: {
    type: "glass",
    background: "rgba(30, 20, 10, 0.78)",
    backdropFilter: "blur(26px)",
    border: "1.5px solid rgba(251, 146, 60, 0.4)", // Warm Amber
    borderRadius: "28px",
    boxShadow: "0 20px 50px rgba(0, 0, 0, 0.55)",
    paddingY: 22,
    paddingX: 42,
    maxWidth: "880px",
    tiltAngle: "0deg",
  },
  colors: {
    primaryText: "#FFF7ED",
    accentText: "#FB923C", // Orange Amber
    accentGlow: "0 0 18px rgba(251, 146, 60, 0.6)",
  },
  motion: {
    entrance: "soft_spring",
    emphasis: "gold_glow",
    exit: "smooth_fade",
    springConfig: {
      damping: 12,
      stiffness: 160,
      mass: 0.6,
    },
    wordStaggerFrames: 2.8,
  },
  camera: {
    defaultMotion: "macro_push",
    hookMotion: "punch_zoom",
    conclusionMotion: "macro_push",
  },
};

export const productCommercialToken: DesignToken = {
  id: "product_commercial",
  name: "Product & Commercial Showcase",
  description: "Dành cho giới thiệu sản phẩm, bán hàng, nêu bật USP, giá và Call-to-Action chuyển đổi.",
  typography: {
    fontFamily: "'Inter', 'Montserrat', -apple-system, sans-serif",
    baseFontSize: 50,
    longTextFontSize: 38,
    lineHeight: 1.2,
    letterSpacing: "0.6px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  card: {
    type: "badge",
    background: "linear-gradient(135deg, #FF1744 0%, #D50000 100%)",
    border: "3.5px solid #FFFFFF",
    borderRadius: "20px",
    boxShadow: "0 16px 40px rgba(213,0,0,0.5), 0 0 16px rgba(255,23,68,0.4)",
    paddingY: 22,
    paddingX: 44,
    maxWidth: "880px",
    tiltAngle: "0deg",
  },
  colors: {
    primaryText: "#FFFFFF",
    accentText: "#FFE600", // Yellow CTA
    accentGlow: "0 0 18px rgba(255, 230, 0, 0.6)",
  },
  motion: {
    entrance: "impact_pop",
    emphasis: "scale_bounce",
    exit: "smooth_fade",
    springConfig: {
      damping: 10,
      stiffness: 210,
      mass: 0.5,
    },
    wordStaggerFrames: 2.2,
  },
  camera: {
    defaultMotion: "snap_zoom",
    hookMotion: "punch_zoom",
    conclusionMotion: "drift_cam",
  },
};
