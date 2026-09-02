import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface KraftTapeProps {
  width?: number;
  height?: number;
  tapeColor?: string;
  tiltAngle?: number;
  delayFrames?: number;
  style?: React.CSSProperties;
}

export const KraftTape: React.FC<KraftTapeProps> = ({
  width = 90,
  height = 32,
  tapeColor = "rgba(220, 195, 155, 0.78)", // Kraft / Washi tape color
  tiltAngle = -4,
  delayFrames = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 14,
      stiffness: 110,
      mass: 0.6,
    },
  });

  return (
    <div
      style={{
        position: "absolute",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: tapeColor,
        backdropFilter: "blur(2px)",
        transform: `scale(${entrance}) rotate(${tiltAngle}deg)`,
        transformOrigin: "center center",
        boxShadow: "1px 2px 4px rgba(0,0,0,0.18)",
        pointerEvents: "none",
        zIndex: 50,
        // Jagged torn ends using CSS clip-path
        clipPath:
          "polygon(0% 10%, 4% 0%, 96% 0%, 100% 12%, 97% 50%, 100% 88%, 95% 100%, 5% 100%, 0% 85%, 3% 50%)",
        borderTop: "1px solid rgba(255,255,255,0.4)",
        borderBottom: "1px solid rgba(0,0,0,0.1)",
        ...style,
      }}
    />
  );
};
