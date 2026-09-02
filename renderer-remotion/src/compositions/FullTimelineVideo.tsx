import React from "react";
import { AbsoluteFill, staticFile } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { slide } from "@remotion/transitions/slide";
import { flip } from "@remotion/transitions/flip";
import { irisCircle } from "../components/transitions/IrisCircleTransition";
import { paperRip } from "../components/transitions/PaperRipTransition";
import { adaptTimelineToRemotion, TimelineData, AdaptedScene } from "../adapters/timelineAdapter";
import { VideoScene } from "../components/VideoScene";

// Production Timeline Data from 7543179816128843046_short01.json
import prodTimelineJson from "../adapters/production_short01.json";

/**
 * Universal Transition Presentation Resolver for Remotion
 * Supports all prompt transitions: fade, wipe (4 directions), slide (4 directions), flip (3D), circle_open, paper_rip, etc.
 */
function resolveTransitionPresentation(type?: string) {
  const clean = String(type || "").toLowerCase().trim();

  // 1. Iris / Circle Open transitions (unboxing, reveal)
  if (clean.includes("circle") || clean.includes("iris")) {
    return irisCircle({ type: "open" });
  }

  // 2. Paper Rip transitions (craft, farm, scrap)
  if (clean.includes("paper") || clean.includes("rip") || clean.includes("tear")) {
    return paperRip({ direction: clean.includes("right") ? "from-right" : "from-left" });
  }

  // 3. Wipe transitions
  if (clean.includes("wipe_left") || clean.includes("wipeleft")) {
    return wipe({ direction: "from-left" });
  }
  if (clean.includes("wipe_right") || clean.includes("wiperight")) {
    return wipe({ direction: "from-right" });
  }
  if (clean.includes("wipe_up") || clean.includes("wipetop") || clean.includes("wipe_top")) {
    return wipe({ direction: "from-top" });
  }
  if (clean.includes("wipe_down") || clean.includes("wipebottom") || clean.includes("wipe_bottom")) {
    return wipe({ direction: "from-bottom" });
  }

  // 4. Slide transitions
  if (clean.includes("slide_up") || clean.includes("slideup")) {
    return slide({ direction: "from-bottom" });
  }
  if (clean.includes("slide_down") || clean.includes("slidedown")) {
    return slide({ direction: "from-top" });
  }
  if (clean.includes("slide_left") || clean.includes("slideleft")) {
    return slide({ direction: "from-right" });
  }
  if (clean.includes("slide_right") || clean.includes("slideright") || clean.includes("slide")) {
    return slide({ direction: "from-left" });
  }

  // 5. 3D Flip transitions
  if (clean.includes("flip")) {
    return flip({ direction: "from-left" });
  }

  // 6. Default: Smooth cinematic crossfade (fade, dissolve, pixelize fallback)
  return fade();
}

export const FullTimelineVideo: React.FC<{
  timelineData?: TimelineData;
  videoSrc?: string;
}> = ({
  timelineData = prodTimelineJson as any,
  videoSrc = staticFile("source_video.mp4"),
}) => {
  const { scenes } = adaptTimelineToRemotion(timelineData, 30);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <TransitionSeries>
        {scenes.map((scene: AdaptedScene, idx: number) => {
          const hasTransition = scene.transitionOut && idx < scenes.length - 1;
          const transDurFrames = hasTransition
            ? Math.max(1, Math.round((scene.transitionOut?.duration || 0.3) * 30))
            : 0;

          // Mathematical Compensation:
          // In TransitionSeries, transitions overlap the adjacent sequence by transDurFrames.
          // By adding transDurFrames to durationInFrames, each scene maintains its full duration
          // and the total TransitionSeries duration matches exactly sum(scene.durationInFrames)
          // preventing any black frames at the end of the video!
          const sequenceDurationInFrames = scene.durationInFrames + transDurFrames;

          return (
            <React.Fragment key={scene.id}>
              <TransitionSeries.Sequence durationInFrames={sequenceDurationInFrames}>
                <VideoScene scene={scene} videoSrc={videoSrc} />
              </TransitionSeries.Sequence>

              {hasTransition && (
                <TransitionSeries.Transition
                  presentation={resolveTransitionPresentation(scene.transitionOut?.type) as any}
                  timing={linearTiming({ durationInFrames: transDurFrames })}
                />
              )}
            </React.Fragment>
          );
        })}
      </TransitionSeries>
    </AbsoluteFill>
  );
};
