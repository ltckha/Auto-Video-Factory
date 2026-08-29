import { DesignToken } from "./tokens";

export const cinematicTravelToken: DesignToken = {
  id: "cinematic_travel",
  name: "Cinematic Travel & Da Lat",
  description: "Dành cho cảnh quay flycam, Đà Lạt, road trip. Khoảng trống âm lớn, font mỏng, giãn chữ 3.5px, phong cảnh là nhân vật chính.",
  typography: {
    fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
    baseFontSize: 42,
    longTextFontSize: 32,
    lineHeight: 1.35,
    letterSpacing: "3.5px",
    fontWeight: 600,
    textTransform: "uppercase",
  },
  card: {
    type: "glass",
    background: "rgba(15, 23, 42, 0.48)", // High transparency to let scenery shine
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    borderRadius: "20px",
    boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
    paddingY: 16,
    paddingX: 36,
    maxWidth: "820px",
    tiltAngle: "0deg",
  },
  colors: {
    primaryText: "#FFFFFF",
    accentText: "#38BDF8", // Sky Blue
    accentGlow: "0 0 16px rgba(56, 189, 248, 0.5)",
  },
  motion: {
    entrance: "slide_up",
    emphasis: "neon_pulse",
    exit: "smooth_fade",
    springConfig: {
      damping: 17,
      stiffness: 110,
      mass: 0.85,
    },
    wordStaggerFrames: 3.5,
  },
  camera: {
    defaultMotion: "drift_cam",
    hookMotion: "punch_zoom",
    conclusionMotion: "macro_push",
  },
};
