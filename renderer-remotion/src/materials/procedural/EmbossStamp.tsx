import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface EmbossStampProps {
  text?: string;
  subtext?: string;
  variant?: "circular_seal" | "leather_deboss" | "rubber_stamp";
  color?: string;
  size?: number;
  delayFrames?: number;
  style?: React.CSSProperties;
}

export const EmbossStamp: React.FC<EmbossStampProps> = ({
  text = "HANDMADE",
  subtext = "HẢI NANCY",
  variant = "circular_seal",
  color = "#8B4513", // Saddle Brown
  size = 110,
  delayFrames = 8,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Tactile Press & Rebound Spring animation
  const stampSpring = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 12,
      stiffness: 140,
      mass: 0.5,
    },
  });

  const scale = 0.5 + 0.5 * stampSpring;
  const opacity = Math.min(1, stampSpring * 1.5);

  if (variant === "leather_deboss") {
    return (
      <div
        style={{
          position: "absolute",
          padding: "8px 16px",
          border: "2px solid rgba(0,0,0,0.35)",
          borderRadius: "6px",
          backgroundColor: "rgba(0,0,0,0.12)",
          transform: `scale(${scale}) rotate(-3deg)`,
          opacity,
          boxShadow: "inset 1px 2px 3px rgba(0,0,0,0.6), 1px 1px 0px rgba(255,255,255,0.2)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 45,
          ...style,
        }}
      >
        <span
          style={{
            fontFamily: "Playfair Display, serif",
            fontWeight: 900,
            fontSize: "14px",
            letterSpacing: "2px",
            color: "rgba(30,15,5,0.85)",
            textShadow: "1px 1px 0px rgba(255,255,255,0.25), -1px -1px 0px rgba(0,0,0,0.4)",
          }}
        >
          {text}
        </span>
        {subtext && (
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "9px",
              letterSpacing: "1.5px",
              color: "rgba(50,25,10,0.7)",
            }}
          >
            {subtext}
          </span>
        )}
      </div>
    );
  }

  // Circular Seal Variant
  return (
    <div
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: `3px dashed ${color}`,
        backgroundColor: "rgba(255, 248, 235, 0.15)",
        backdropFilter: "blur(2px)",
        transform: `scale(${scale}) rotate(-6deg)`,
        opacity,
        boxShadow: "0px 4px 10px rgba(0,0,0,0.2)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        zIndex: 45,
        ...style,
      }}
    >
      <div
        style={{
          width: "82%",
          height: "82%",
          borderRadius: "50%",
          border: `1.5px solid ${color}`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "4px",
        }}
      >
        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 900,
            fontSize: "10px",
            letterSpacing: "1px",
            color: color,
            textAlign: "center",
          }}
        >
          {text}
        </span>
        <div style={{ width: "24px", height: "1px", backgroundColor: color, margin: "2px 0" }} />
        {subtext && (
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 800,
              fontSize: "8px",
              letterSpacing: "0.5px",
              color: color,
              textAlign: "center",
            }}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
