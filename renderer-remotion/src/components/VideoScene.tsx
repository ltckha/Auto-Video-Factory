import React from "react";
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import { AdaptedScene } from "../adapters/timelineAdapter";
import { MotionComposer } from "../motion/motionRegistry";
import { SubtitleCard } from "./SubtitleCard";
import { EmbossStamp } from "../materials/procedural/EmbossStamp";
import { resolveBrandSafely } from "../brand/brandDna";

export const VideoScene: React.FC<{
  scene: AdaptedScene;
  videoSrc: string;
}> = ({ scene, videoSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intensity = (scene as any).intensity || 0.7;

  // 1. Camera Motion Physics calculation via MotionComposer
  const motion = MotionComposer.evaluateCamera(
    (scene.cameraMotion as any) || "macro_push",
    frame,
    fps,
    scene.durationInFrames,
    intensity
  );

  const brand = resolveBrandSafely(scene.subtitle || (scene as any).visual_cue || "");
  const isHook = (scene as any).scene_type === "hook";
  const isConclusion = (scene as any).scene_type === "conclusion";

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000", overflow: "hidden" }}>
      {/* Background Video Layer with Smooth Camera Transform (100% PURE ORIGINAL COLORS) */}
      <AbsoluteFill
        style={{
          transform: `scale(${motion.scale}) translate(${motion.translateX}px, ${motion.translateY}px)`,
          transformOrigin: "center center",
        }}
      >
        <OffthreadVideo
          src={videoSrc}
          startFrom={scene.startFromFrame}
          playbackRate={scene.playbackRate || 1.0}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </AbsoluteFill>

      {/* Official Brand Stamp (Only when brand is verified 100% safely) */}
      {brand && (isHook || isConclusion) && (
        <EmbossStamp
          text={brand.name.toUpperCase()}
          subtext="CHÍNH HÃNG"
          variant="circular_seal"
          color="#FFE600"
          size={105}
          delayFrames={8}
          style={{
            bottom: "220px",
            right: "50px",
          }}
        />
      )}

      {/* Subtitle Card with Kinetic Typography Overlay (Active 2.5s) */}
      {scene.subtitle && (
        <SubtitleCard
          text={scene.subtitle}
          token={scene.token}
          subtitleStyle={scene.subtitleStyle}
          position={scene.position}
          displayDurationS={2.5}
          intensity={intensity}
          treatment={scene.textTreatment || "word_pop"}
          composition={scene.textComposition || (scene.subtitle.includes("\n") && scene.subtitleStyle === "minimal_glass_card" ? "editorial_eyebrow" : "centered")}
        />
      )}
    </AbsoluteFill>
  );
};
