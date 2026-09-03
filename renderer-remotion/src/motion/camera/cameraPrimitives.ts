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

/**
 * CapCut Graphs Style: Fast-In, Slow-Out Cinematic Glide Zoom
 * S-curve ease-out: pushes in with high momentum then decelerates smoothly
 */
export function cinematicGlideZoom(
  frame: number,
  durationInFrames: number,
  intensity = 0.75
): CameraMotionOutput {
  const progress = frame / Math.max(1, durationInFrames);
  // CapCut Ease-Out 3rd power curve: 1 - (1 - t)^3
  const easeOutProgress = 1 - Math.pow(1 - progress, 3);
  const targetScale = 1.0 + 0.10 * Math.max(0.1, Math.min(1.0, intensity));
  const scale = interpolate(easeOutProgress, [0, 1], [1.0, targetScale]);
  return { scale, translateX: 0, translateY: 0 };
}

/**
 * Universal Cinematic Push Out / Pull Out
 * Smooth decelerated pull-back from (1.0 + 0.20 * intensity) down to 1.0
 * Fully dynamic: intensity controls pull-back depth
 */
export function pushOut(
  frame: number,
  durationInFrames: number,
  intensity = 0.65
): CameraMotionOutput {
  const progress = frame / Math.max(1, durationInFrames);
  // Ease-Out Power Curve: 1 - (1 - t)^2.5
  const easeOutProgress = 1 - Math.pow(1 - progress, 2.5);
  const startScale = 1.0 + 0.20 * Math.max(0.1, Math.min(1.0, intensity));
  const scale = interpolate(easeOutProgress, [0, 1], [startScale, 1.0]);
  return { scale, translateX: 0, translateY: 0 };
}

/**
 * Beat-Sync Micro Jitter Physics
 * Injects a tiny, punchy micro-shake (±2px to 4px) for 2-3 frames on beat drops
 */
export function applyMicroJitter(
  currentOutput: CameraMotionOutput,
  frame: number,
  intensity = 0.7,
  beatIntervalFrames = 30
): CameraMotionOutput {
  const beatOffset = frame % Math.max(15, beatIntervalFrames);
  if (beatOffset < 3) {
    const decay = 1 - beatOffset / 3;
    const maxJitterPx = 3.5 * Math.max(0.2, Math.min(1.0, intensity));
    const jitterX = (Math.sin(frame * 12.7) > 0 ? 1 : -1) * maxJitterPx * decay;
    const jitterY = (Math.cos(frame * 14.3) > 0 ? 1 : -1) * (maxJitterPx * 0.7) * decay;
    return {
      scale: currentOutput.scale * (1 + 0.015 * decay),
      translateX: currentOutput.translateX + jitterX,
      translateY: currentOutput.translateY + jitterY,
    };
  }
  return currentOutput;
}
