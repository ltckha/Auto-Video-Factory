import { DesignToken } from "./tokens";

export const luxuryEditorialToken: DesignToken = {
  id: "luxury_editorial",
  name: "Luxury Vogue Editorial",
  description: "Dành cho boots Ý, da thuộc cao cấp. Font Serif thanh lịch, viền chỉ vàng kim cổ điển (Antique Gold), chuyển động tối giản.",
  typography: {
    fontFamily: "'Playfair Display', 'Didot', 'Georgia', serif",
    baseFontSize: 44,
    longTextFontSize: 34,
    lineHeight: 1.3,
    letterSpacing: "2.5px",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  card: {
    type: "editorial",
    background: "rgba(10, 10, 10, 0.85)",
    backdropFilter: "blur(32px)",
    border: "1px solid rgba(212, 175, 55, 0.45)", // Antique Gold hairline
    borderRadius: "16px",
    boxShadow: "0 24px 60px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(212, 175, 55, 0.35)",
    paddingY: 18,
    paddingX: 44,
    maxWidth: "840px",
    tiltAngle: "0deg",
  },
  colors: {
    primaryText: "#F8F8F8",
    accentText: "#D4AF37", // Metallic Antique Gold
    accentGlow: "0 0 16px rgba(212, 175, 55, 0.45)",
  },
  motion: {
    entrance: "cinematic_fade",
    emphasis: "gold_glow",
    exit: "smooth_fade",
    springConfig: {
      damping: 18,
      stiffness: 100,
      mass: 0.9,
    },
    wordStaggerFrames: 4.0,
  },
  camera: {
    defaultMotion: "drift_cam",
    hookMotion: "macro_push",
    conclusionMotion: "drift_cam",
  },
};
