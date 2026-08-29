import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface KineticSubtitleProps {
  text: string;
  preset: "minimal_glass_card" | "vibrant_yellow_sticker" | "warning_red_badge" | "vibrant_yellow_lightning_sticker";
  position?: "top" | "center" | "bottom";
  displayDurationS?: number;
}

export const KineticSubtitleCard: React.FC<KineticSubtitleProps> = ({
  text = "",
  preset = "minimal_glass_card",
  position = "top",
  displayDurationS = 2.5,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Edge case: Empty or whitespace-only text
  if (!text || text.trim().length === 0) {
    return null;
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return null;
  }

  // 1. Dynamic Font Sizing based on word count & character length to prevent overflow
  const totalCharCount = text.length;
  let fontSize = 52;
  let paddingY = 24;
  let paddingX = 44;

  if (totalCharCount > 50 || words.length > 8) {
    fontSize = 38;
    paddingY = 18;
    paddingX = 32;
  } else if (totalCharCount > 35 || words.length > 5) {
    fontSize = 44;
    paddingY = 20;
    paddingX = 38;
  }

  // 2. Entrance Spring Animation (0s -> 0.3s)
  const cardEntrance = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 150,
      mass: 0.7,
    },
  });

  const cardScale = interpolate(cardEntrance, [0, 1], [0.65, 1]);
  const cardTranslateY = interpolate(cardEntrance, [0, 1], [-35, 0]);
  const cardOpacity = interpolate(cardEntrance, [0, 1], [0, 1]);

  // 3. Exit Fade-out Animation (e.g. 2.2s -> 2.5s)
  const exitStartFrame = Math.max(0, Math.floor((displayDurationS - 0.3) * fps));
  const exitEndFrame = Math.max(exitStartFrame + 1, Math.floor(displayDurationS * fps));

  const exitOpacity = interpolate(
    frame,
    [exitStartFrame, exitEndFrame],
    [1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const totalOpacity = cardOpacity * exitOpacity;

  // Preset Styling configurations
  const getPresetStyles = () => {
    switch (preset) {
      case "vibrant_yellow_sticker":
        return {
          background: "linear-gradient(135deg, #FFE600 0%, #FFCC00 100%)",
          border: "4px solid #000000",
          borderRadius: "22px",
          boxShadow: "0 16px 32px rgba(0,0,0,0.4), 0 6px 0px #000000",
          color: "#000000",
          transformRotate: "-2.5deg",
          fontFamily: "'Inter', 'Montserrat', -apple-system, sans-serif",
          fontWeight: 900,
          textTransform: "uppercase" as const,
        };
      case "warning_red_badge":
        return {
          background: "linear-gradient(135deg, #FF1744 0%, #D50000 100%)",
          border: "3.5px solid #FFFFFF",
          borderRadius: "20px",
          boxShadow: "0 14px 36px rgba(213,0,0,0.55), 0 0 16px rgba(255,23,68,0.5)",
          color: "#FFFFFF",
          transformRotate: "0deg",
          fontFamily: "'Inter', 'Montserrat', -apple-system, sans-serif",
          fontWeight: 900,
          textTransform: "uppercase" as const,
        };
      case "vibrant_yellow_lightning_sticker":
        return {
          background: "linear-gradient(135deg, #FFF500 0%, #FF9900 100%)",
          border: "4px solid #111111",
          borderRadius: "26px",
          boxShadow: "0 18px 38px rgba(255,153,0,0.45), 0 8px 0px #111111",
          color: "#111111",
          transformRotate: "2.5deg",
          fontFamily: "'Inter', 'Montserrat', -apple-system, sans-serif",
          fontWeight: 900,
          textTransform: "uppercase" as const,
        };
      case "minimal_glass_card":
      default:
        return {
          background: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(28px) saturate(190%)",
          border: "1.5px solid rgba(255, 255, 255, 0.32)",
          borderRadius: "26px",
          boxShadow: "0 22px 55px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          color: "#FFFFFF",
          transformRotate: "0deg",
          fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
          fontWeight: 800,
          textTransform: "uppercase" as const,
        };
    }
  };

  const presetStyle = getPresetStyles();

  // Position Top/Center/Bottom
  const getPositionStyle = () => {
    switch (position) {
      case "center":
        return { top: "50%", transform: "translateY(-50%)" };
      case "bottom":
        return { bottom: "160px" };
      case "top":
      default:
        return { top: "140px" };
    }
  };

  if (totalOpacity <= 0) {
    return null;
  }

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        ...getPositionStyle(),
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "0 40px",
        pointerEvents: "none",
        zIndex: 999,
      }}
    >
      <div
        style={{
          background: presetStyle.background,
          backdropFilter: presetStyle.backdropFilter,
          border: presetStyle.border,
          borderRadius: presetStyle.borderRadius,
          boxShadow: presetStyle.boxShadow,
          padding: `${paddingY}px ${paddingX}px`,
          maxWidth: "880px",
          opacity: totalOpacity,
          transform: `scale(${cardScale}) translateY(${cardTranslateY}px) rotate(${presetStyle.transformRotate})`,
          transformOrigin: "center center",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "10px 14px",
        }}
      >
        {words.map((word, idx) => {
          // Staggered word pop (starts 3 frames apart)
          const wordDelay = Math.floor(idx * 3.0) + 3;
          const wordSpring = spring({
            frame: frame - wordDelay,
            fps,
            config: {
              damping: 10,
              stiffness: 190,
              mass: 0.55,
            },
          });

          const wordScale = interpolate(wordSpring, [0, 1], [0.35, 1]);
          const wordOpacity = interpolate(wordSpring, [0, 1], [0, 1]);
          const wordTranslateY = interpolate(wordSpring, [0, 1], [20, 0]);

          const isAccentWord = idx === 0 || idx === words.length - 1 || word.length >= 6;

          let wordColor = presetStyle.color;
          if (preset === "minimal_glass_card" && isAccentWord) {
            wordColor = "#FACC15"; // Golden Yellow Accent
          } else if (preset === "vibrant_yellow_sticker" && idx === 0) {
            wordColor = "#000000";
          }

          return (
            <span
              key={idx}
              style={{
                display: "inline-block",
                fontFamily: presetStyle.fontFamily,
                fontWeight: presetStyle.fontWeight,
                fontSize: `${fontSize}px`,
                lineHeight: "1.25",
                letterSpacing: "0.5px",
                color: wordColor,
                opacity: wordOpacity,
                transform: `scale(${wordScale}) translateY(${wordTranslateY}px)`,
                transformOrigin: "center bottom",
                textShadow:
                  preset === "minimal_glass_card"
                    ? "0 3px 14px rgba(0,0,0,0.65)"
                    : "none",
              }}
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
};
