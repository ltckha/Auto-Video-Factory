import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface DimensionLineProps {
  valueText?: string;
  labelText?: string;
  length?: number;
  orientation?: "horizontal" | "vertical";
  color?: string;
  delayFrames?: number;
  style?: React.CSSProperties;
}

export const DimensionLine: React.FC<DimensionLineProps> = ({
  valueText = "1.8 mm",
  labelText = "ĐỘ DÀY DA",
  length = 200,
  orientation = "horizontal",
  color = "#FFE600",
  delayFrames = 5,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 18,
      stiffness: 95,
      mass: 0.8,
    },
  });

  const isHorizontal = orientation === "horizontal";
  const scale = Math.min(1, progress);

  return (
    <div
      style={{
        position: "absolute",
        display: "flex",
        flexDirection: isHorizontal ? "column" : "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "4px",
        pointerEvents: "none",
        zIndex: 40,
        ...style,
      }}
    >
      {/* Dimension Line with Arrow / Tick Ends */}
      <div
        style={{
          position: "relative",
          width: isHorizontal ? `${length}px` : "2px",
          height: isHorizontal ? "2px" : `${length}px`,
          backgroundColor: color,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          boxShadow: "0px 1px 3px rgba(0,0,0,0.5)",
        }}
      >
        {/* Start Tick */}
        <div
          style={{
            position: "absolute",
            left: isHorizontal ? 0 : "-5px",
            top: isHorizontal ? "-5px" : 0,
            width: isHorizontal ? "2px" : "12px",
            height: isHorizontal ? "12px" : "2px",
            backgroundColor: color,
          }}
        />
        {/* End Tick */}
        <div
          style={{
            position: "absolute",
            right: isHorizontal ? 0 : "-5px",
            bottom: isHorizontal ? "-5px" : 0,
            width: isHorizontal ? "2px" : "12px",
            height: isHorizontal ? "12px" : "2px",
            backgroundColor: color,
          }}
        />
      </div>

      {/* Measurement Value Badge */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "rgba(0, 0, 0, 0.75)",
          padding: "3px 8px",
          borderRadius: "4px",
          border: `1px solid ${color}`,
          opacity: Math.min(1, progress * 1.4),
        }}
      >
        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 900,
            fontSize: "11px",
            color: color,
            letterSpacing: "0.5px",
          }}
        >
          {valueText}
        </span>
        {labelText && (
          <span
            style={{
              fontFamily: "Be Vietnam Pro, sans-serif",
              fontWeight: 700,
              fontSize: "9px",
              color: "#FFFFFF",
              letterSpacing: "0.5px",
            }}
          >
            {labelText}
          </span>
        )}
      </div>
    </div>
  );
};
