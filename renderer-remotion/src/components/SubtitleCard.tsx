import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { DesignToken } from "../styles/tokens";
import { asmrCraftToken } from "../styles/asmrCraft";
import { MotionComposer } from "../motion/motionRegistry";
import { KineticText, TextTreatment, TextComposition } from "./KineticText";
import { ShimmerGlowOverlay } from "./overlays/AtmosphericOverlays";

export interface SubtitleCardProps {
  text: string;
  token?: DesignToken;
  subtitleStyle?: string;
  position?: "top" | "center" | "bottom";
  displayDurationS?: number;
  intensity?: number;
  treatment?: TextTreatment;
  composition?: TextComposition;
  stepNumber?: number | string;
}

export const SubtitleCard: React.FC<SubtitleCardProps> = ({
  text = "",
  token = asmrCraftToken,
  subtitleStyle = "",
  position = "top",
  displayDurationS = 2.5,
  intensity = 0.7,
  treatment,
  composition,
  stepNumber,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text || text.trim().length === 0) {
    return null;
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) {
    return null;
  }

  // 1. Dynamic Font Sizing & Padding based on text length and token
  const totalCharCount = text.length;
  let fontSize = token.typography.baseFontSize;
  let paddingY = token.card.paddingY;
  let paddingX = token.card.paddingX;

  if (totalCharCount > 40 || words.length > 6) {
    fontSize = token.typography.longTextFontSize;
    paddingY = Math.max(14, paddingY - 4);
    paddingX = Math.max(28, paddingX - 8);
  }

  // 2. Entrance Motion from Motion Composer
  const entrance = MotionComposer.evaluateCard(
    token.motion.entrance,
    frame,
    fps,
    intensity,
    token.motion.springConfig
  );

  // 3. Exit Motion from Motion Composer
  const exitOpacity = MotionComposer.evaluateExit(
    token.motion.exit,
    frame,
    fps,
    displayDurationS
  );

  const totalOpacity = entrance.opacity * exitOpacity;

  // Position Top/Center/Bottom
  const getPositionStyle = () => {
    switch (position) {
      case "center":
        return { top: "50%", transform: "translateY(-50%)" };
      case "bottom":
        return { bottom: "180px" };
      case "top":
      default:
        return { top: "150px" };
    }
  };

  if (totalOpacity <= 0) {
    return null;
  }

  const isLightning = subtitleStyle.includes("lightning") || subtitleStyle.includes("light") || token.id === "viral_tiktok";
  const isGlass = token.card.type === "glass";
  const isBadge = token.card.type === "badge";
  const isWashi = subtitleStyle.includes("washi") || token.card.type === "washi_tape";
  const isEditorial = subtitleStyle.includes("editorial") || token.card.type === "editorial_line";
  const isPriceTag = subtitleStyle.includes("price") || subtitleStyle.includes("pill") || token.card.type === "price_tag_pill";
  const isNeon = subtitleStyle.includes("neon") || token.card.type === "neon_glow";

  // Dynamic Card Visual Overrides
  let cardBackground = token.card.background;
  let cardBorder = token.card.border;
  let cardBorderRadius = token.card.borderRadius;
  let cardBoxShadow = token.card.boxShadow;
  let cardBackdropFilter = token.card.backdropFilter;
  let cardTilt = token.card.tiltAngle;

  let customToken = token;

  if (isWashi) {
    cardBackground = "#f5eee1";
    cardBorder = "1px dashed #b8a892";
    cardBorderRadius = "4px";
    cardBoxShadow = "3px 4px 12px rgba(0,0,0,0.35)";
    cardTilt = "-1.2deg";
    customToken = {
      ...token,
      colors: { ...token.colors, primaryText: "#251a12", accentText: "#8a3c0e" },
    };
  } else if (isEditorial) {
    cardBackground = "transparent";
    cardBorder = "none";
    cardBorderRadius = "0px";
    cardBoxShadow = "none";
    cardTilt = "0deg";
    customToken = {
      ...token,
      colors: { ...token.colors, primaryText: "#ffffff", accentText: "#FFE600" },
    };
  } else if (isPriceTag) {
    cardBackground = "linear-gradient(135deg, #FF6B00 0%, #FF2600 100%)";
    cardBorder = "2px solid #FFE600";
    cardBorderRadius = "9999px";
    cardBoxShadow = "0 8px 24px rgba(255, 60, 0, 0.45)";
    customToken = {
      ...token,
      colors: { ...token.colors, primaryText: "#ffffff", accentText: "#FFE600" },
    };
  } else if (isNeon) {
    cardBackground = "rgba(10, 14, 26, 0.85)";
    cardBorder = "2px solid #00F0FF";
    cardBorderRadius = "16px";
    cardBoxShadow = "0 0 22px rgba(0, 240, 255, 0.6), inset 0 0 12px rgba(0, 240, 255, 0.25)";
    cardBackdropFilter = "blur(14px)";
    customToken = {
      ...token,
      colors: { ...token.colors, primaryText: "#ffffff", accentText: "#00F0FF" },
    };
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
          position: "relative",
          background: cardBackground,
          backdropFilter: cardBackdropFilter,
          border: cardBorder,
          borderLeft: isEditorial ? "6px solid #FFE600" : cardBorder,
          borderRadius: cardBorderRadius,
          boxShadow: cardBoxShadow,
          padding: isEditorial ? `${paddingY}px ${paddingX}px ${paddingY}px 24px` : `${paddingY}px ${paddingX}px`,
          maxWidth: token.card.maxWidth,
          opacity: totalOpacity,
          transform: `scale(${entrance.scale}) translateY(${entrance.translateY}px) rotate(${cardTilt})`,
          transformOrigin: "center center",
          overflow: "visible",
        }}
      >
        {/* Shimmer Light Glint Effect across the Card */}
        {(isGlass || isBadge) && <ShimmerGlowOverlay delayFrames={12} durationFrames={22} />}

        {/* Dynamic Accents for Vibrant Lightning Sticker (From Mockup 858) */}
        {isLightning && (
          <>
            {/* Top-Left Lightning Bolt */}
            <div
              style={{
                position: "absolute",
                top: "-20px",
                left: "-16px",
                background: "#FFE600",
                border: "3px solid #000000",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "22px",
                boxShadow: "3px 3px 0px #000000",
                zIndex: 30,
              }}
            >
              ⚡
            </div>

            {/* Bottom-Right Lightning Bolt */}
            <div
              style={{
                position: "absolute",
                bottom: "-18px",
                right: "-14px",
                background: "#FFE600",
                border: "3px solid #000000",
                borderRadius: "50%",
                width: "38px",
                height: "38px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "20px",
                boxShadow: "3px 3px 0px #000000",
                zIndex: 30,
              }}
            >
              ⚡
            </div>

            {/* Top-Right Sparkle Star */}
            <div
              style={{
                position: "absolute",
                top: "-12px",
                right: "18px",
                color: "#000000",
                fontSize: "22px",
                fontWeight: 900,
                zIndex: 30,
              }}
            >
              ✦
            </div>

            {/* Bottom-Left Sparkle Star */}
            <div
              style={{
                position: "absolute",
                bottom: "-10px",
                left: "24px",
                color: "#000000",
                fontSize: "18px",
                fontWeight: 900,
                zIndex: 30,
              }}
            >
              ✦
            </div>
          </>
        )}

        <KineticText
          text={text}
          token={customToken}
          fontSize={fontSize}
          intensity={intensity}
          treatment={treatment}
          composition={composition}
          stepNumber={stepNumber}
        />
      </div>
    </div>
  );
};
