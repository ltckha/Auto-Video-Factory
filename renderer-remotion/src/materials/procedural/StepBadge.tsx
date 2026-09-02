import React from "react";
import { useCurrentFrame, spring } from "remotion";

export interface StepBadgeProps {
  stepNumber?: number | string;
  stepLabel?: string;
  color?: string;
  scale?: number;
}

/**
 * Procedural Step Badge for Tutorial / Craft Process Sequences (01, 02, 03)
 */
export const StepBadge: React.FC<StepBadgeProps> = ({
  stepNumber = "01",
  stepLabel = "BƯỚC",
  color = "#FFE600",
  scale = 1.0,
}) => {
  const frame = useCurrentFrame();

  const popProgress = spring({
    frame,
    fps: 30,
    config: { damping: 12, stiffness: 160 },
  });

  const formattedNum = String(stepNumber).padStart(2, "0");

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        backgroundColor: "#111111",
        border: `2px solid ${color}`,
        borderRadius: "999px",
        padding: "4px 14px 4px 8px",
        gap: "8px",
        boxShadow: "0 6px 16px rgba(0,0,0,0.45)",
        transform: `scale(${popProgress * scale})`,
        transformOrigin: "left center",
      }}
    >
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#000000",
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 900,
          fontSize: "12px",
        }}
      >
        {formattedNum}
      </div>
      <span
        style={{
          color: "#FFFFFF",
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          fontSize: "13px",
          letterSpacing: "1px",
          textTransform: "uppercase",
        }}
      >
        {stepLabel}
      </span>
    </div>
  );
};
