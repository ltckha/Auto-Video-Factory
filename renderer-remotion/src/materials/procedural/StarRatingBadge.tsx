import React from "react";
import { useCurrentFrame, spring } from "remotion";

export interface StarRatingBadgeProps {
  rating?: number;
  label?: string;
  scale?: number;
}

/**
 * Procedural 5-Star Rating & Quality Trust Badge
 */
export const StarRatingBadge: React.FC<StarRatingBadgeProps> = ({
  rating = 5,
  label = "ĐÁNH GIÁ 5 SAO",
  scale = 1.0,
}) => {
  const frame = useCurrentFrame();

  const popProgress = spring({
    frame,
    fps: 30,
    config: { damping: 14, stiffness: 180 },
  });

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "rgba(18, 18, 22, 0.92)",
        backdropFilter: "blur(12px)",
        border: "1.5px solid rgba(255, 230, 0, 0.5)",
        borderRadius: "12px",
        padding: "6px 14px",
        gap: "4px",
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
        transform: `scale(${popProgress * scale})`,
      }}
    >
      <div style={{ display: "flex", gap: "4px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill={star <= rating ? "#FFE600" : "#444444"}
          >
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
        ))}
      </div>
      <span
        style={{
          color: "#FFE600",
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 800,
          fontSize: "11px",
          letterSpacing: "0.5px",
        }}
      >
        {label}
      </span>
    </div>
  );
};
