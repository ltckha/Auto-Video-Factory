import React from "react";
import { AbsoluteFill, Series, staticFile } from "remotion";
import { adaptTimelineToRemotion, TimelineData } from "../adapters/timelineAdapter";
import { VideoScene } from "../components/VideoScene";

// Production Timeline Data from 7543179816128843046_short01.json
import prodTimelineJson from "../adapters/production_short01.json";

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
      <Series>
        {scenes.map((scene) => (
          <Series.Sequence
            key={scene.id}
            durationInFrames={scene.durationInFrames}
          >
            <VideoScene scene={scene} videoSrc={videoSrc} />
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
