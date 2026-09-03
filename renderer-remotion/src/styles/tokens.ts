export type EntranceMotionType = "soft_spring" | "impact_pop" | "slide_up" | "cinematic_fade";
export type EmphasisMotionType = "gold_glow" | "neon_pulse" | "scale_bounce" | "underline_draw";
export type ExitMotionType = "smooth_fade" | "slide_down" | "shrink_blur";
export type CameraMotionType =
  | "macro_push"
  | "punch_zoom"
  | "drift_cam"
  | "snap_zoom"
  | "cinematic_glide_zoom"
  | "static"
  | "push_in"
  | "pull_out"
  | "slow_zoom_in"
  | "push_out";

export type ColorGradeType = "clean_minimal" | "dark_moody" | "teal_orange" | "warm_cinema";

export interface TypographyToken {
  fontFamily: string;
  baseFontSize: number;
  longTextFontSize: number;
  lineHeight: number;
  letterSpacing: string;
  fontWeight: number;
  textTransform: "uppercase" | "none" | "capitalize";
}

export interface CardToken {
  type:
    | "glass"
    | "sticker"
    | "badge"
    | "editorial"
    | "washi_tape"
    | "editorial_line"
    | "price_tag_pill"
    | "neon_glow"
    | "none";
  background: string;
  backdropFilter?: string;
  border: string;
  borderRadius: string;
  boxShadow: string;
  paddingY: number;
  paddingX: number;
  maxWidth: string;
  tiltAngle: string;
}

export interface ColorToken {
  primaryText: string;
  accentText: string;
  accentGlow?: string;
  badgeBackground?: string;
  badgeText?: string;
}

export interface MotionToken {
  entrance: EntranceMotionType;
  emphasis: EmphasisMotionType;
  exit: ExitMotionType;
  springConfig: {
    damping: number;
    stiffness: number;
    mass: number;
  };
  wordStaggerFrames: number;
}

export interface CameraToken {
  defaultMotion: CameraMotionType;
  hookMotion: CameraMotionType;
  conclusionMotion: CameraMotionType;
}

export interface DesignToken {
  id: string;
  name: string;
  description: string;
  typography: TypographyToken;
  card: CardToken;
  colors: ColorToken;
  motion: MotionToken;
  camera: CameraToken;
}
