import { punchZoom, macroPush, driftCam, cinematicGlideZoom, pushOut, applyMicroJitter, CameraMotionOutput } from "./camera/cameraPrimitives";
import { calculateCardReveal, CardMotionOutput } from "./card/cardPrimitives";
import { calculateWordPop, WordMotionOutput } from "./text/textPrimitives";
import { calculateExitMotion } from "./motionGrammar";
import { CameraMotionType, EntranceMotionType, ExitMotionType } from "../styles/tokens";
import { SpringConfig } from "./springs";

export interface MotionPlan {
  camera: {
    type: CameraMotionType;
    intensity: number;
  };
  card: {
    entrance: EntranceMotionType;
    intensity: number;
    springConfig?: SpringConfig;
  };
  text: {
    staggerFrames: number;
    intensity: number;
    springConfig?: SpringConfig;
  };
  exit: {
    type: ExitMotionType;
    displayDurationS: number;
  };
}

export class MotionComposer {
  static evaluateCamera(
    motionType: CameraMotionType,
    frame: number,
    fps: number,
    durationInFrames: number,
    intensity = 0.7,
    microJitter = false
  ): CameraMotionOutput {
    let output: CameraMotionOutput;
    switch (motionType) {
      case "punch_zoom":
        output = punchZoom(frame, fps, intensity);
        break;
      case "macro_push":
      case "push_in":
      case "slow_zoom_in":
        output = macroPush(frame, durationInFrames, intensity);
        break;
      case "push_out":
      case "pull_out":
        output = pushOut(frame, durationInFrames, intensity);
        break;
      case "drift_cam":
        output = driftCam(frame, durationInFrames, intensity);
        break;
      case "cinematic_glide_zoom":
        output = cinematicGlideZoom(frame, durationInFrames, intensity);
        break;
      case "static":
      default:
        output = { scale: 1.0, translateX: 0, translateY: 0 };
        break;
    }

    if (microJitter) {
      output = applyMicroJitter(output, frame, intensity);
    }

    return output;
  }

  static evaluateCard(
    entranceType: EntranceMotionType,
    frame: number,
    fps: number,
    intensity = 0.7,
    springConfig?: SpringConfig
  ): CardMotionOutput {
    return calculateCardReveal(frame, fps, entranceType, intensity, springConfig);
  }

  static evaluateWord(
    frame: number,
    wordIndex: number,
    fps: number,
    staggerFrames = 3.0,
    intensity = 0.7,
    springConfig?: SpringConfig
  ): WordMotionOutput {
    return calculateWordPop(frame, wordIndex, fps, staggerFrames, intensity, springConfig);
  }

  static evaluateExit(
    exitType: ExitMotionType,
    frame: number,
    fps: number,
    displayDurationS = 2.5
  ): number {
    return calculateExitMotion(exitType, frame, fps, displayDurationS);
  }
}
