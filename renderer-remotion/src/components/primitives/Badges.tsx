import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export const LocationPinBadge: React.FC<{
  locationText?: string;
  delayFrames?: number;
}> = ({
  locationText = "ĐÀ LẠT • LÂM ĐỒNG",
  delayFrames = 5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  if (frame < delayFrames) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(16px)",
        border: "1.5px solid rgba(56, 189, 248, 0.5)",
        borderRadius: "30px",
        padding: "8px 20px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.4)",
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      <span style={{ fontSize: "20px" }}>📍</span>
      <span
        style={{
          color: "#FFFFFF",
          fontSize: "22px",
          fontFamily: "'Be Vietnam Pro', 'Montserrat', sans-serif",
          fontWeight: 800,
          letterSpacing: "1.2px",
          textTransform: "uppercase",
        }}
      >
        {locationText}
      </span>
    </div>
  );
};

export const LeatherStampBadge: React.FC<{
  text?: string;
  subText?: string;
  delayFrames?: number;
}> = ({
  text = "YEN LEATHER",
  subText = "100% GENUINE CRAFT",
  delayFrames = 8,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: 14, stiffness: 150, mass: 0.6 },
  });

  if (frame < delayFrames) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        border: "2px dashed #D4AF37",
        borderRadius: "14px",
        background: "rgba(10, 10, 10, 0.85)",
        padding: "10px 22px",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(212, 175, 55, 0.2)",
        transform: `scale(${scale}) rotate(-3deg)`,
        transformOrigin: "center center",
      }}
    >
      <span
        style={{
          color: "#D4AF37",
          fontSize: "20px",
          fontFamily: "'Playfair Display', 'Georgia', serif",
          fontWeight: 900,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
        }}
      >
        {text}
      </span>
      <span
        style={{
          color: "#E2E8F0",
          fontSize: "13px",
          fontFamily: "'Inter', sans-serif",
          fontWeight: 700,
          letterSpacing: "2px",
          textTransform: "uppercase",
          marginTop: "2px",
        }}
      >
        {subText}
      </span>
    </div>
  );
};

export const PriceTagBadge: React.FC<{
  priceText: string;
  label?: string;
  delayFrames?: number;
}> = ({
  priceText = "199.000đ",
  label = "ƯU ĐÃI",
  delayFrames = 6,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.5 },
  });

  if (frame < delayFrames) return null;

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        background: "linear-gradient(135deg, #FF1744 0%, #D50000 100%)",
        border: "3px solid #FFFFFF",
        borderRadius: "16px",
        padding: "8px 22px",
        boxShadow: "0 14px 35px rgba(213,0,0,0.5), 0 5px 0px #881337",
        transform: `scale(${scale}) rotate(-2deg)`,
        transformOrigin: "center center",
      }}
    >
      <span
        style={{
          background: "#FFE600",
          color: "#000000",
          fontSize: "14px",
          fontWeight: 900,
          padding: "3px 8px",
          borderRadius: "6px",
          fontFamily: "'Paytone One', sans-serif",
        }}
      >
        {label}
      </span>
      <span
        style={{
          color: "#FFFFFF",
          fontSize: "26px",
          fontFamily: "'Paytone One', 'Montserrat', sans-serif",
          fontWeight: 900,
          letterSpacing: "0.5px",
        }}
      >
        {priceText}
      </span>
    </div>
  );
};
