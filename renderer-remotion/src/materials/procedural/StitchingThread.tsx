import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface StitchingThreadProps {
  length?: number;
  stitchColor?: string;
  holeColor?: string;
  orientation?: "horizontal" | "vertical";
  stitchAngleDeg?: number;
  stitchSpacing?: number;
  delayFrames?: number;
  style?: React.CSSProperties;
}

export const StitchingThread: React.FC<StitchingThreadProps> = ({
  length = 320,
  stitchColor = "#E6C687", // Natural waxed linen thread color
  holeColor = "#2A1810",   // Dark punched hole shadow
  orientation = "horizontal",
  stitchAngleDeg = 45,
  stitchSpacing = 16,
  delayFrames = 0,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numStitches = Math.floor(length / stitchSpacing);

  const progress = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 22,
      stiffness: 90,
      mass: 0.9,
    },
  });

  const visibleCount = Math.floor(numStitches * Math.min(1, progress));

  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: orientation === "horizontal" ? "row" : "column",
        alignItems: "center",
        justifyContent: "flex-start",
        gap: `${stitchSpacing - 8}px`,
        pointerEvents: "none",
        zIndex: 25,
        ...style,
      }}
    >
      {Array.from({ length: numStitches }).map((_, idx) => {
        const isVisible = idx < visibleCount;
        if (!isVisible) return null;

        return (
          <div
            key={idx}
            style={{
              position: "relative",
              width: "12px",
              height: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Dark Punched Diamond Hole */}
            <div
              style={{
                position: "absolute",
                width: "4px",
                height: "4px",
                backgroundColor: holeColor,
                borderRadius: "1px",
                transform: "rotate(45deg)",
                opacity: 0.8,
              }}
            />

            {/* Angled Waxed Thread Stitch */}
            <div
              style={{
                position: "absolute",
                width: "10px",
                height: "2.5px",
                backgroundColor: stitchColor,
                borderRadius: "2px",
                transform: `rotate(${stitchAngleDeg}deg)`,
                boxShadow: "0px 1px 1.5px rgba(0,0,0,0.4)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};
