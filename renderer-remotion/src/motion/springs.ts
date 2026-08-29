export interface SpringConfig {
  damping: number;
  stiffness: number;
  mass: number;
}

export const SPRING_PRESETS: Record<string, SpringConfig> = {
  soft_spring: {
    damping: 14,
    stiffness: 140,
    mass: 0.7,
  },
  impact_pop: {
    damping: 10,
    stiffness: 200,
    mass: 0.5,
  },
  cinematic_fade: {
    damping: 18,
    stiffness: 110,
    mass: 0.85,
  },
  slide_up: {
    damping: 16,
    stiffness: 120,
    mass: 0.8,
  },
  snap_bounce: {
    damping: 8,
    stiffness: 220,
    mass: 0.45,
  },
};
