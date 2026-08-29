import { interpolate, spring } from "remotion";
import { SpringConfig } from "../springs";

export interface CameraMotionOutput {
  scale: number;
  translateX: number;
  translateY: number;
}

/**
 * Pure Style-Agnostic Punch Zoom Primitive
 * @param frame Current frame
 * @param fps Frames per second
 * @param intensity 0.0 (subtle) to 1.0 (extreme)
 * @param config Optional spring config
 */
export function punchZoom(
  frame: number,
  fps: number,
  intensity = 0.7,
  config: SpringConfig = { damping: 14, stiffness: 130, mass: 0.7 }
): CameraMotionOutput {
  const punchSpring = spring({
    frame,
    fps,
    config,
  });

  // Scale ranges dynamically scaled by intensity:
  // intensity = 0.2 -> 1.03x to 1.01x
  // intensity = 1.0 -> 1.15x to 1.03x
  const startScale = 1.0 + 0.12 * Math.max(0.1, Math.min(1.0, intensity));
  const settleScale = 1.0 + 0.03 * Math.max(0.1, Math.min(1.0, intensity));

  const scale = interpolate(punchSpring, [0, 1], [startScale, settleScale]);
  return { scale, translateX: 0, translateY: 0 };
}

/**
 * Pure Style-Agnostic Macro Push Primitive
 */
export function macroPush(
  frame: number,
  durationInFrames: number,
  intensity = 0.6
): CameraMotionOutput {
  const maxCreep = 1.0 + 0.06 * Math.max(0.1, Math.min(1.0, intensity));
  const scale = interpolate(
    frame,
    [0, Math.max(1, durationInFrames)],
    [1.0, maxCreep],
    { extrapolateRight: "clamp" }
  );
  return { scale, translateX: 0, translateY: 0 };
}

/**
 * Pure Style-Agnostic Drift Cam Primitive
 */
export function driftCam(
  frame: number,
  durationInFrames: number,
  intensity = 0.6
): CameraMotionOutput {
  const progress = frame / Math.max(1, durationInFrames);
  const maxScale = 1.0 + 0.05 * Math.max(0.1, Math.min(1.0, intensity));
  const maxShiftX = 12 * Math.max(0.1, Math.min(1.0, intensity));
  const maxShiftY = 6 * Math.max(0.1, Math.min(1.0, intensity));

  const scale = interpolate(progress, [0, 1], [1.01, maxScale]);
  const translateX = interpolate(progress, [0, 1], [-maxShiftX, maxShiftX]);
  const translateY = interpolate(progress, [0, 1], [-maxShiftY, maxShiftY]);

  return { scale, translateX, translateY };
}
