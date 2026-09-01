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

/**
 * Split text into lines:
 * 1. Respect explicit '\n' line breaks.
 * 2. If no '\n' and text has >= 4 words (or > 18 chars), auto-split into 2 rhythmic lines (Action Line + Punchline).
 */
function parseSubtitleLines(rawText: string): string[] {
  const clean = rawText.trim();
  if (clean.includes("\n")) {
    return clean.split("\n").map((l) => l.trim()).filter(Boolean);
  }
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length >= 4 || clean.length > 18) {
    // Split into 2 lines: line 1 has ceil(N * 0.55), line 2 has remaining punch words
    const splitPoint = Math.ceil(words.length * 0.55);
    return [
      words.slice(0, splitPoint).join(" "),
      words.slice(splitPoint).join(" "),
    ];
  }
  return [clean];
}

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  token = asmrCraftToken,
  fontSize,
  intensity = 0.7,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text || text.trim().length === 0) return null;

  const lines = parseSubtitleLines(text);
  const baseFontSize = fontSize || token.typography.baseFontSize;

  let globalWordIndex = 0;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        width: "100%",
      }}
    >
      {lines.map((line, lineIdx) => {
        const lineWords = line.split(/\s+/).filter(Boolean);
        if (lineWords.length === 0) return null;

        // Dynamic Uneven Typography Scaling:
        // When there are multiple lines, a short punchline (1-2 words) or the second line
        // automatically gets a larger font size (+15% to +22%) to create visual hierarchy & drama!
        let lineScale = 1.0;
        if (lines.length > 1) {
          if (lineWords.length <= 2 && lines.length === 2) {
            lineScale = 1.20; // Short punchy line pops larger
          } else if (lineIdx === lines.length - 1) {
            lineScale = 1.15; // Final climax line
          } else if (lineWords.length >= 4) {
            lineScale = 0.94; // Longer context line slightly tighter
          }
        }

        const currentLineFontSize = Math.round(baseFontSize * lineScale);

        return (
          <div
            key={lineIdx}
            style={{
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              alignItems: "center",
              gap: "8px 12px",
            }}
          >
            {lineWords.map((word, wIdx) => {
              const currentWordIndex = globalWordIndex++;

              // Pure motion primitive evaluation
              const wordMotion = MotionComposer.evaluateWord(
                frame,
                currentWordIndex,
                fps,
                token.motion.wordStaggerFrames,
                intensity,
                token.motion.springConfig
              );

              // Keyword accent rule: last word of a short punchline, or key words
              const isPunchline = lineIdx === lines.length - 1;
              const isAccentWord = (isPunchline && wIdx === lineWords.length - 1) || word.length >= 7;

              let wordColor = token.colors.primaryText;
              let textShadow = "none";

              if (isAccentWord || (isPunchline && lineWords.length <= 2)) {
                wordColor = token.colors.accentText;
                if (token.colors.accentGlow) {
                  textShadow = token.colors.accentGlow;
                }
              }

              return (
                <span
                  key={wIdx}
                  style={{
                    display: "inline-block",
                    fontFamily: token.typography.fontFamily,
                    fontWeight: token.typography.fontWeight,
                    fontSize: `${currentLineFontSize}px`,
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
      })}
    </div>
  );
};
