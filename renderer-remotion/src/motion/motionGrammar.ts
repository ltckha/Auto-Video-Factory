import { interpolate, spring } from "remotion";
import { EntranceMotionType, ExitMotionType, EmphasisMotionType } from "../styles/tokens";
import { SpringConfig, SPRING_PRESETS } from "./springs";

export interface EntranceMotionResult {
  scale: number;
  translateY: number;
  opacity: number;
}

export function calculateEntranceMotion(
  type: EntranceMotionType,
  frame: number,
  fps: number,
  customConfig?: SpringConfig
): EntranceMotionResult {
  const config = customConfig || SPRING_PRESETS[type] || SPRING_PRESETS.soft_spring;
  const progress = spring({
    frame,
    fps,
    config,
  });

  switch (type) {
    case "impact_pop": {
      const scale = interpolate(progress, [0, 1], [0.4, 1]);
      const translateY = interpolate(progress, [0, 1], [-25, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }

    case "slide_up": {
      const scale = interpolate(progress, [0, 1], [0.85, 1]);
      const translateY = interpolate(progress, [0, 1], [40, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }

    case "cinematic_fade": {
      const scale = interpolate(progress, [0, 1], [0.95, 1]);
      const translateY = interpolate(progress, [0, 1], [-10, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }

    case "soft_spring":
    default: {
      const scale = interpolate(progress, [0, 1], [0.65, 1]);
      const translateY = interpolate(progress, [0, 1], [-35, 0]);
      const opacity = interpolate(progress, [0, 1], [0, 1]);
      return { scale, translateY, opacity };
    }
  }
}

export function calculateExitMotion(
  type: ExitMotionType,
  frame: number,
  fps: number,
  displayDurationS = 2.5
): number {
  const exitStartFrame = Math.max(0, Math.floor((displayDurationS - 0.35) * fps));
  const exitEndFrame = Math.max(exitStartFrame + 1, Math.floor(displayDurationS * fps));

  return interpolate(frame, [exitStartFrame, exitEndFrame], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
