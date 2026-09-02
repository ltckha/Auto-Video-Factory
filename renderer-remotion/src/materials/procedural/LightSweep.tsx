import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export interface LightSweepProps {
  delayFrames?: number;
  durationFrames?: number;
  angleDeg?: number;
  color?: string;
  style?: React.CSSProperties;
}

export const LightSweep: React.FC<LightSweepProps> = ({
  delayFrames = 10,
  durationFrames = 25,
  angleDeg = 35,
  color = "rgba(255, 255, 255, 0.45)",
  style = {},
}) => {
  const frame = useCurrentFrame();

  const progress = interpolate(
    frame,
    [delayFrames, delayFrames + durationFrames],
    [-100, 200],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const opacity = interpolate(
    frame,
    [
      delayFrames,
      delayFrames + durationFrames * 0.2,
      delayFrames + durationFrames * 0.8,
      delayFrames + durationFrames,
    ],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  if (frame < delayFrames || frame > delayFrames + durationFrames) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        overflow: "hidden",
        opacity,
        zIndex: 35,
        ...style,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: `${progress}%`,
          width: "120px",
          height: "200%",
          background: `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`,
          transform: `rotate(${angleDeg}deg)`,
          filter: "blur(8px)",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
};
