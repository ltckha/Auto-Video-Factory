export type MaterialFamilyId =
  | "artisan_leather"
  | "organic_farm"
  | "product_showcase"
  | "editorial_look";

export type SurfaceType = "leather" | "kraft_paper" | "fabric" | "torn_paper" | "none";
export type MarkType =
  | "circle"
  | "arrow"
  | "underline"
  | "highlight"
  | "check_mark"
  | "cross_mark"
  | "scribble"
  | "bracket_box"
  | "dimension"
  | "none";

export type PhysicalElementType =
  | "tape"
  | "stamp"
  | "tag"
  | "paper_clip"
  | "push_pin"
  | "price_badge"
  | "before_after"
  | "none";

export type LightType = "specular_sweep" | "soft_glow" | "subtle_grain" | "film_burn" | "none";
export type FoleyType =
  | "leather_rub"
  | "stitch_pull"
  | "stamp_press"
  | "paper_tear"
  | "hammer_tap"
  | "brush_sweep"
  | "clip_click"
  | "whoosh_soft"
  | "none";

export interface VisualMaterialConfig {
  surface?: SurfaceType;
  mark?: MarkType;
  markTarget?: "center" | "keyword" | "top_right" | "bottom_left";
  physicalElement?: PhysicalElementType;
  light?: LightType;
  primaryColor?: string;
  accentColor?: string;
  opacity?: number;
  rotationDeg?: number;
}

export interface MotionMaterialConfig {
  entrance: "draw_in" | "stamp_down" | "tape_stick" | "sweep_through" | "soft_fade" | "slide_split";
  durationFrames: number;
  delayFrames: number;
  springDamping: number;
  springStiffness: number;
}

export interface SonicMaterialConfig {
  foleyType: FoleyType;
  gain: number;
  pitchVariation: number;
  timingOffsetFrames: number;
}

export interface CreativeMaterialDefinition {
  id: string;
  name: string;
  description: string;
  category: "surface" | "mark" | "physical" | "light" | "sound";
  isProcedural: boolean;
  visual: VisualMaterialConfig;
  motion: MotionMaterialConfig;
  sonic: SonicMaterialConfig;
}

export interface MaterialFamily {
  id: MaterialFamilyId;
  name: string;
  description: string;
  defaultSurface: SurfaceType;
  defaultMark: MarkType;
  defaultPhysical: PhysicalElementType;
  defaultLight: LightType;
  defaultFoley: FoleyType;
  tags: string[];
}
