import { DesignToken } from "./tokens";

export const asmrCraftToken: DesignToken = {
  id: "asmr_craft",
  name: "ASMR Handcraft & Leather (YEN Leather Signature)",
  description: "Dành cho đồ da, phục hồi giày, chế tác thủ công. Kính mờ siêu thực, chữ Serif sang trọng, không che tay thợ.",
  typography: {
    fontFamily: "'Playfair Display', 'Cinzel', 'Georgia', serif",
    baseFontSize: 46,
    longTextFontSize: 36,
    lineHeight: 1.3,
    letterSpacing: "1.2px",
    fontWeight: 800,
    textTransform: "uppercase",
  },
  card: {
    type: "glass",
    background: "rgba(15, 23, 42, 0.72)",
    backdropFilter: "blur(26px) saturate(180%)",
    border: "1.5px solid rgba(255, 255, 255, 0.45)",
    borderRadius: "26px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6), inset 0 1.5px 0 rgba(255, 255, 255, 0.4)",
    paddingY: 22,
    paddingX: 42,
    maxWidth: "880px",
    tiltAngle: "0deg",
  },
  colors: {
    primaryText: "#FFFFFF",
    accentText: "#FACC15", // Warm Golden Amber
    accentGlow: "0 0 20px rgba(250, 204, 21, 0.5)",
  },
  motion: {
    entrance: "soft_spring",
    emphasis: "gold_glow",
    exit: "smooth_fade",
    springConfig: {
      damping: 15,
      stiffness: 140,
      mass: 0.7,
    },
    wordStaggerFrames: 3,
  },
  camera: {
    defaultMotion: "macro_push",
    hookMotion: "punch_zoom",
    conclusionMotion: "macro_push",
  },
};
