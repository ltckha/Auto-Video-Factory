import React from "react";

export interface SurfaceGrainOverlayProps {
  opacity?: number;
  blendMode?: "overlay" | "soft-light" | "screen" | "multiply";
}

export const SurfaceGrainOverlay: React.FC<SurfaceGrainOverlayProps> = ({
  opacity = 0.04,
  blendMode = "overlay",
}) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: "none",
        opacity,
        mixBlendMode: blendMode,
        zIndex: 20,
      }}
    >
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <filter id="organicNoiseFilter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#organicNoiseFilter)" />
      </svg>
    </div>
  );
};
