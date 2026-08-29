import { interpolate, spring } from "remotion";
import { SpringConfig } from "../springs";

export interface CardMotionOutput {
  scale: number;
  translateY: number;
  opacity: number;
}

/**
 * Pure Style-Agnostic Card Reveal Primitive
 * @param frame Current frame
 * @param fps FPS
 * @param entranceType "soft_spring" | "impact_pop" | "slide_up" | "cinematic_fade"
 * @param intensity 0.0 to 1.0
 * @param config Spring config
 */
export function calculateCardReveal(
  frame: number,
  fps: number,
  entranceType = "soft_spring",
  intensity = 0.7,
  config: SpringConfig = { damping: 14, stiffness: 140, mass: 0.7 }
): CardMotionOutput {
  const progress = spring({
    frame,
    fps,
    config,
  });

  const scaledShiftY = 40 * Math.max(0.2, Math.min(1.0, intensity));

  switch (entranceType) {
    case "impact_pop": {
      const minScale = 1.0 - 0.6 * Math.max(0.2, Math.min(1.0, intensity));
      const scale = interpolate(progress, [0, 1], [minScale, 1]);
      const translateY = interpolate(progress, [0, 1], [-scaledShiftY * 0.7, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }

    case "slide_up": {
      const scale = interpolate(progress, [0, 1], [0.9, 1]);
      const translateY = interpolate(progress, [0, 1], [scaledShiftY, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }

    case "cinematic_fade": {
      const scale = interpolate(progress, [0, 1], [0.97, 1]);
      const translateY = interpolate(progress, [0, 1], [-scaledShiftY * 0.25, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }

    case "soft_spring":
    default: {
      const minScale = 1.0 - 0.35 * Math.max(0.2, Math.min(1.0, intensity));
      const scale = interpolate(progress, [0, 1], [minScale, 1]);
      const translateY = interpolate(progress, [0, 1], [-scaledShiftY, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }
  }
}
