import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export const MarkerSwipe: React.FC<{
  color?: string;
  delayFrames?: number;
  height?: number;
}> = ({
  color = "#FACC15",
  delayFrames = 8,
  height = 14,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 14,
      stiffness: 160,
      mass: 0.6,
    },
  });

  const widthPercent = interpolate(progress, [0, 1], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        left: "-4px",
        bottom: "4px",
        height: `${height}px`,
        width: `${widthPercent}%`,
        backgroundColor: color,
        opacity: 0.75,
        borderRadius: "4px",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
};
