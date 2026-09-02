import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface BeforeAfterSliderProps {
  beforeLabel?: string;
  afterLabel?: string;
  delayFrames?: number;
  durationFrames?: number;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}

export const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  beforeLabel = "TRƯỚC PHỤC HỒI",
  afterLabel = "HOÀN THIỆN",
  delayFrames = 10,
  durationFrames = 60,
  width = 380,
  height = 70,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance spring
  const entrance = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 16,
      stiffness: 100,
      mass: 0.7,
    },
  });

  // Slider bar movement from left 20% to 80%
  const sliderPos = interpolate(
    frame,
    [delayFrames + 10, delayFrames + durationFrames],
    [25, 75],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  return (
    <div
      style={{
        position: "absolute",
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: "rgba(15, 23, 42, 0.85)",
        backdropFilter: "blur(8px)",
        borderRadius: "8px",
        border: "1.5px solid rgba(255, 255, 255, 0.2)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 18px",
        transform: `scale(${entrance})`,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Before Label */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", zIndex: 2 }}>
        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: "9px", fontWeight: 800, color: "#94A3B8", letterSpacing: "1px" }}>
          BEFORE
        </span>
        <span style={{ fontFamily: "Be Vietnam Pro, sans-serif", fontSize: "12px", fontWeight: 900, color: "#E2E8F0" }}>
          {beforeLabel}
        </span>
      </div>

      {/* Dynamic Animated Divider Line */}
      <div
        style={{
          position: "absolute",
          left: `${sliderPos}%`,
          top: 0,
          bottom: 0,
          width: "2.5px",
          backgroundColor: "#FFE600",
          boxShadow: "0 0 10px #FFE600",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 4,
        }}
      >
        <div
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "#FFE600",
            border: "2px solid #000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "8px",
            color: "#000",
            fontWeight: 900,
          }}
        >
          ↔
        </div>
      </div>

      {/* After Label */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", zIndex: 2 }}>
        <span style={{ fontFamily: "Montserrat, sans-serif", fontSize: "9px", fontWeight: 800, color: "#FFE600", letterSpacing: "1px" }}>
          AFTER
        </span>
        <span style={{ fontFamily: "Be Vietnam Pro, sans-serif", fontSize: "12px", fontWeight: 900, color: "#FFE600" }}>
          {afterLabel}
        </span>
      </div>
    </div>
  );
};
