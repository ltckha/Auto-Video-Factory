import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { DesignToken } from "../styles/tokens";
import { asmrCraftToken } from "../styles/asmrCraft";
import { MotionComposer } from "../motion/motionRegistry";

export interface KineticTextProps {
  text: string;
  token?: DesignToken;
  fontSize?: number;
  intensity?: number;
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  token = asmrCraftToken,
  fontSize,
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;

  const resolvedFontSize = fontSize || token.typography.baseFontSize;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: "10px 14px",
      }}
    >
      {words.map((word, idx) => {
        // Pure motion primitive evaluation
        const wordMotion = MotionComposer.evaluateWord(
          frame,
          idx,
          fps,
          token.motion.wordStaggerFrames,
          intensity,
          token.motion.springConfig
        );

        // Keyword accent rule: first word, last word, or words longer than 5 chars
        const isAccentWord = idx === 0 || idx === words.length - 1 || word.length >= 6;

        let wordColor = token.colors.primaryText;
        let textShadow = "none";

        if (isAccentWord) {
          wordColor = token.colors.accentText;
          if (token.colors.accentGlow) {
            textShadow = token.colors.accentGlow;
          }
        }

        return (
          <span
            key={idx}
            style={{
              display: "inline-block",
              fontFamily: token.typography.fontFamily,
              fontWeight: token.typography.fontWeight,
              fontSize: `${resolvedFontSize}px`,
              lineHeight: token.typography.lineHeight,
              letterSpacing: token.typography.letterSpacing,
              textTransform: token.typography.textTransform,
              color: wordColor,
              opacity: wordMotion.opacity,
              transform: `scale(${wordMotion.scale}) translateY(${wordMotion.translateY}px)`,
              transformOrigin: "center bottom",
              textShadow,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
