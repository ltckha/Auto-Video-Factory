import { interpolate, spring } from "remotion";

export type CameraMotionType =
  | "punch_zoom"
  | "macro_push"
  | "drift_cam"
  | "snap_zoom"
  | "overshoot_zoom"
  | "static";

export interface CameraMotionResult {
  scale: number;
  translateX: number;
  translateY: number;
}

export function calculateCameraMotion(
  motionType: CameraMotionType,
  frame: number,
  fps: number,
  durationInFrames: number
): CameraMotionResult {
  switch (motionType) {
    case "punch_zoom": {
      // Spring impulse zoom: Starts close (1.08x) and smoothly settles to 1.02x
      const punchSpring = spring({
        frame,
        fps,
        config: {
          damping: 14,
          stiffness: 130,
          mass: 0.7,
        },
      });
      const scale = interpolate(punchSpring, [0, 1], [1.08, 1.02]);
      return { scale, translateX: 0, translateY: 0 };
    }

    case "macro_push": {
      // Cinematic slow creep forward: 1.00x -> 1.04x over scene duration
      const scale = interpolate(
        frame,
        [0, Math.max(1, durationInFrames)],
        [1.0, 1.045],
        { extrapolateRight: "clamp" }
      );
      return { scale, translateX: 0, translateY: 0 };
    }

    case "drift_cam": {
      // Slow diagonal drift: slight scale + subtle translation
      const progress = frame / Math.max(1, durationInFrames);
      const scale = interpolate(progress, [0, 1], [1.02, 1.05]);
      const translateX = interpolate(progress, [0, 1], [-8, 8]);
      const translateY = interpolate(progress, [0, 1], [-4, 4]);
      return { scale, translateX, translateY };
    }

    case "snap_zoom": {
      // Snappy quick zoom into the action
      const snapSpring = spring({
        frame,
        fps,
        config: {
          damping: 10,
          stiffness: 220,
          mass: 0.5,
        },
      });
      const scale = interpolate(snapSpring, [0, 1], [1.0, 1.07]);
      return { scale, translateX: 0, translateY: 0 };
    }

    case "overshoot_zoom": {
      // Overshoot bounce zoom
      const overSpring = spring({
        frame,
        fps,
        config: {
          damping: 8,
          stiffness: 160,
          mass: 0.6,
        },
      });
      const scale = interpolate(overSpring, [0, 1], [1.0, 1.05]);
      return { scale, translateX: 0, translateY: 0 };
    }

    case "static":
    default:
      return { scale: 1.0, translateX: 0, translateY: 0 };
  }
}
