import { interpolate, spring } from "remotion";
import { SpringConfig } from "../springs";

export interface WordMotionOutput {
  scale: number;
  translateY: number;
  opacity: number;
}

/**
 * Pure Style-Agnostic Word Pop Primitive
 */
export function calculateWordPop(
  frame: number,
  wordIndex: number,
  fps: number,
  staggerFrames = 3.0,
  intensity = 0.7,
  config: SpringConfig = { damping: 11, stiffness: 190, mass: 0.55 }
): WordMotionOutput {
  const wordDelay = Math.floor(wordIndex * staggerFrames) + 2;
  const wordSpring = spring({
    frame: frame - wordDelay,
    fps,
    config,
  });

  const minScale = 1.0 - 0.65 * Math.max(0.2, Math.min(1.0, intensity));
  const maxShiftY = 24 * Math.max(0.2, Math.min(1.0, intensity));

  const scale = interpolate(wordSpring, [0, 1], [minScale, 1]);
  const opacity = interpolate(wordSpring, [0, 1], [0, 1]);
  const translateY = interpolate(wordSpring, [0, 1], [maxShiftY, 0]);

  return { scale, translateY, opacity };
}
