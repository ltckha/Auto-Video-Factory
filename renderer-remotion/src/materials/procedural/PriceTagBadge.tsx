import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface PriceTagBadgeProps {
  priceText?: string;
  originalPriceText?: string;
  badgeLabel?: string;
  currency?: string;
  delayFrames?: number;
  style?: React.CSSProperties;
}

export const PriceTagBadge: React.FC<PriceTagBadgeProps> = ({
  priceText = "850.000",
  originalPriceText = "1.200.000",
  badgeLabel = "GIÁ ƯU ĐÃI",
  currency = "₫",
  delayFrames = 6,
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
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#FFE600",
        border: "2.5px solid #000000",
        borderRadius: "8px",
        boxShadow: "4px 4px 0px #000000",
        padding: "10px 16px",
        transform: `scale(${entrance}) rotate(-2deg)`,
        transformOrigin: "center center",
        pointerEvents: "none",
        zIndex: 50,
        ...style,
      }}
    >
      {/* Top Label */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "9px",
            fontWeight: 900,
            color: "#000000",
            letterSpacing: "1px",
            backgroundColor: "#FFFFFF",
            padding: "2px 6px",
            borderRadius: "4px",
            border: "1px solid #000",
          }}
        >
          {badgeLabel}
        </span>
        {originalPriceText && (
          <span
            style={{
              fontFamily: "Be Vietnam Pro, sans-serif",
              fontSize: "11px",
              fontWeight: 700,
              color: "#666666",
              textDecoration: "line-through",
            }}
          >
            {originalPriceText} {currency}
          </span>
        )}
      </div>

      {/* Main Big Price */}
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span
          style={{
            fontFamily: "Paytone One, Montserrat, sans-serif",
            fontSize: "26px",
            fontWeight: 900,
            color: "#D90429",
            letterSpacing: "-0.5px",
          }}
        >
          {priceText}
        </span>
        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontSize: "14px",
            fontWeight: 900,
            color: "#D90429",
          }}
        >
          {currency}
        </span>
      </div>
    </div>
  );
};
