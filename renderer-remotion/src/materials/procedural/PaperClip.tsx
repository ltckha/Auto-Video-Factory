import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface PaperClipProps {
  variant?: "silver_clip" | "brass_pin";
  size?: number;
  delayFrames?: number;
  style?: React.CSSProperties;
}

export const PaperClip: React.FC<PaperClipProps> = ({
  variant = "silver_clip",
  size = 60,
  delayFrames = 2,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 14,
      stiffness: 120,
      mass: 0.5,
    },
  });

  if (variant === "brass_pin") {
    return (
      <div
        style={{
          position: "absolute",
          width: `${size * 0.4}px`,
          height: `${size * 0.4}px`,
          borderRadius: "50%",
          background: "radial-gradient(circle at 35% 35%, #FFE28A 0%, #C49A45 70%, #6E4E14 100%)",
          boxShadow: "1px 3px 6px rgba(0,0,0,0.45), inset -1px -1px 2px rgba(0,0,0,0.5)",
          transform: `scale(${entrance})`,
          pointerEvents: "none",
          zIndex: 55,
          ...style,
        }}
      />
    );
  }

  // Metallic Silver Paper Clip SVG
  return (
    <div
      style={{
        position: "absolute",
        width: `${size * 0.45}px`,
        height: `${size}px`,
        transform: `scale(${entrance}) rotate(-12deg)`,
        filter: "drop-shadow(2px 3px 3px rgba(0,0,0,0.35))",
        pointerEvents: "none",
        zIndex: 55,
        ...style,
      }}
    >
      <svg
        viewBox="0 0 30 70"
        width="100%"
        height="100%"
        fill="none"
      >
        <path
          d="M 10,65 L 10,20 C 10,10 20,10 20,20 L 20,55 C 20,62 14,62 14,55 L 14,25 C 14,18 16,18 16,25 L 16,50"
          stroke="#D8D8D8"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Specular metallic highlight line */}
        <path
          d="M 11,62 L 11,21 C 11,12 19,12 19,21 L 19,54"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinecap="round"
          opacity="0.8"
        />
      </svg>
    </div>
  );
};
