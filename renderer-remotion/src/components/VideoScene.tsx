import React from "react";
import { AbsoluteFill, OffthreadVideo, useCurrentFrame, useVideoConfig } from "remotion";
import { AdaptedScene } from "../adapters/timelineAdapter";
import { MotionComposer } from "../motion/motionRegistry";
import { SubtitleCard } from "./SubtitleCard";
import { resolveMaterialSpecification } from "../materials/materialResolver";
import { StitchingThread } from "../materials/procedural/StitchingThread";
import { HandMark } from "../materials/procedural/HandMark";
import { EmbossStamp } from "../materials/procedural/EmbossStamp";
import { DimensionLine } from "../materials/procedural/DimensionLine";
import { LightSweep } from "../materials/procedural/LightSweep";
import { SurfaceGrainOverlay } from "../materials/procedural/SurfaceGrainOverlay";
import { StarRatingBadge } from "../materials/procedural/StarRatingBadge";
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

  // 2. Resolve Dynamic Sensory Creative Material Specification
  const materialSpec = resolveMaterialSpecification(scene as any);
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

      {/* Subtle Organic Film Grain (If Family specifies) */}
      {materialSpec.visual.light === "subtle_grain" && <SurfaceGrainOverlay opacity={0.04} />}

      {/* Specular Light Sweep Overlay (Active during key moments) */}
      {materialSpec.enableLightSweep && (
        <LightSweep
          delayFrames={4}
          durationFrames={Math.min(32, Math.floor(scene.durationInFrames * 0.7))}
        />
      )}

      {/* Procedural Saddle Stitching Thread (For Leathercraft scenes) */}
      {materialSpec.enableStitching && (
        <div
          style={{
            position: "absolute",
            bottom: "160px",
            left: "40px",
            right: "40px",
            display: "flex",
            justifyContent: "center",
            zIndex: 30,
            pointerEvents: "none",
          }}
        >
          <StitchingThread length={720} delayFrames={2} stitchColor="#FFE600" />
        </div>
      )}

      {/* Dimension Line Measurement Callout */}
      {materialSpec.enableDimension && (
        <DimensionLine
          valueText="1.8 mm"
          labelText="ĐỘ DÀY DA MỘC"
          length={220}
          color="#FFE600"
          delayFrames={5}
          style={{
            top: "52%",
            left: "50%",
            transform: "translate(-50%, -50%)",
          }}
        />
      )}

      {/* Star Rating Badge for Quality Trust */}
      {materialSpec.enableStarRating && (
        <div style={{ position: "absolute", top: "180px", right: "40px", zIndex: 25 }}>
          <StarRatingBadge rating={5} label="CHẤT LƯỢNG CAO" />
        </div>
      )}

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
          composition={scene.textComposition || (materialSpec.enableStepBadge ? "step_flow" : (scene.subtitle.includes("\n") && scene.subtitleStyle === "minimal_glass_card" ? "editorial_eyebrow" : "centered"))}
          stepNumber={materialSpec.stepNumber}
        />
      )}
    </AbsoluteFill>
  );
};
