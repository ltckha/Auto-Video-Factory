import { DesignToken } from "./tokens";

export const viralTikTokToken: DesignToken = {
  id: "viral_tiktok",
  name: "Viral TikTok / CapCut (Yellow 3D Sticker)",
  description: "Năng lượng cao, nhãn dán vàng/đen viền kép 3D, chữ nảy giật mạnh theo beat.",
  typography: {
    fontFamily: "'Paytone One', 'Montserrat', 'Be Vietnam Pro', sans-serif",
    baseFontSize: 50,
    longTextFontSize: 38,
    lineHeight: 1.25,
    letterSpacing: "0.8px",
    fontWeight: 900,
    textTransform: "uppercase",
  },
  card: {
    type: "sticker",
    background: "#FFE600",
    border: "4px solid #000000",
    borderRadius: "18px",
    boxShadow: "0 14px 28px rgba(0,0,0,0.35), 6px 6px 0px #000000",
    paddingY: 20,
    paddingX: 38,
    maxWidth: "880px",
    tiltAngle: "-2.5deg",
  },
  colors: {
    primaryText: "#000000",
    accentText: "#E11D48", // Crimson Rose
    accentGlow: "0 0 20px rgba(225, 29, 72, 0.6)",
  },
  motion: {
    entrance: "impact_pop",
    emphasis: "scale_bounce",
    exit: "smooth_fade",
    springConfig: {
      damping: 10,
      stiffness: 200,
      mass: 0.5,
    },
    wordStaggerFrames: 2.5,
  },
  camera: {
    defaultMotion: "snap_zoom",
    hookMotion: "punch_zoom",
    conclusionMotion: "drift_cam",
  },
};
