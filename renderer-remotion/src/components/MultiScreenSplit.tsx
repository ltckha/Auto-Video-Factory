import React from "react";
import { AbsoluteFill, OffthreadVideo } from "remotion";

export interface MultiScreenSplitProps {
  videoSrc: string;
  startFromFrame: number;
  playbackRate?: number;
  mode?: "top_bottom" | "left_right";
  dividerColor?: string;
}

/**
 * Universal Multi-Screen Split / Dual-Angle Showcase Component
 * Renders 2 synchronized angles/viewports with an ultra-clean cinematic divider line
 */
export const MultiScreenSplit: React.FC<MultiScreenSplitProps> = ({
  videoSrc,
  startFromFrame,
  playbackRate = 1.0,
  mode = "top_bottom",
  dividerColor = "rgba(255, 230, 0, 0.4)",
}) => {
  if (mode === "left_right") {
    return (
      <AbsoluteFill style={{ display: "flex", flexDirection: "row", overflow: "hidden" }}>
        {/* Left Viewport: Wide View */}
        <div style={{ width: "50%", height: "100%", position: "relative", overflow: "hidden" }}>
          <OffthreadVideo
            src={videoSrc}
            startFrom={startFromFrame}
            playbackRate={playbackRate}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        {/* Subtle Vertical Divider */}
        <div
          style={{
            width: "2px",
            height: "100%",
            backgroundColor: dividerColor,
            boxShadow: "0 0 10px rgba(0,0,0,0.8)",
            zIndex: 10,
          }}
        />

        {/* Right Viewport: Macro Detail Zoom (1.20x) */}
        <div style={{ width: "50%", height: "100%", position: "relative", overflow: "hidden" }}>
          <OffthreadVideo
            src={videoSrc}
            startFrom={startFromFrame}
            playbackRate={playbackRate}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: "scale(1.20)",
              transformOrigin: "center center",
            }}
          />
        </div>
      </AbsoluteFill>
    );
  }

  // Default: Top / Bottom Split (50% / 50%)
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top Viewport: Master Subject View */}
      <div style={{ width: "100%", height: "50%", position: "relative", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrc}
          startFrom={startFromFrame}
          playbackRate={playbackRate}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
      </div>

      {/* Subtle Horizontal Divider with Glass Glow */}
      <div
        style={{
          width: "100%",
          height: "2px",
          backgroundColor: dividerColor,
          boxShadow: "0 0 12px rgba(255, 230, 0, 0.3), 0 0 4px rgba(0,0,0,0.9)",
          zIndex: 10,
        }}
      />

      {/* Bottom Viewport: Close-up Detail (Macro 1.25x scale) */}
      <div style={{ width: "100%", height: "50%", position: "relative", overflow: "hidden" }}>
        <OffthreadVideo
          src={videoSrc}
          startFrom={startFromFrame}
          playbackRate={playbackRate}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: "scale(1.25)",
            transformOrigin: "center center",
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
