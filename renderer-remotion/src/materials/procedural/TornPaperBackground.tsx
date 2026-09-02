import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface TornPaperBackgroundProps {
  width?: number;
  height?: number;
  paperColor?: string;
  delayFrames?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const TornPaperBackground: React.FC<TornPaperBackgroundProps> = ({
  width = 440,
  height = 140,
  paperColor = "#FAF4E8", // Natural Cream Kraft Paper
  delayFrames = 3,
  children,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 15,
      stiffness: 95,
      mass: 0.7,
    },
  });

  return (
    <div
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: paperColor,
        transform: `scale(${entrance}) rotate(-1.5deg)`,
        transformOrigin: "center center",
        boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px 24px",
        pointerEvents: "none",
        zIndex: 30,
        // Procedural jagged torn paper edges
        clipPath:
          "polygon(0% 4%, 3% 0%, 15% 3%, 30% 1%, 45% 4%, 60% 0%, 75% 3%, 90% 1%, 100% 5%, 98% 25%, 100% 50%, 97% 75%, 100% 95%, 85% 98%, 70% 95%, 55% 99%, 40% 96%, 25% 100%, 10% 97%, 0% 94%, 2% 70%, 0% 45%, 3% 20%)",
        borderTop: "1px solid rgba(255,255,255,0.6)",
        borderBottom: "1px solid rgba(0,0,0,0.15)",
        ...style,
      }}
    >
      {children}
    </div>
  );
};
