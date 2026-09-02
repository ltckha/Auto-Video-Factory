import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { DesignToken } from "../styles/tokens";
import { asmrCraftToken } from "../styles/asmrCraft";
import { MotionComposer } from "../motion/motionRegistry";
import { StepBadge } from "../materials/procedural/StepBadge";

export type TextTreatment =
  | "word_pop"
  | "masked_slide"
  | "tracking_expand"
  | "typewriter"
  | "outlined_punch";

export type TextComposition =
  | "centered"
  | "editorial_eyebrow"
  | "bracketed_spec"
  | "step_flow";

export interface KineticTextProps {
  text: string;
  token?: DesignToken;
  fontSize?: number;
  intensity?: number;
  treatment?: TextTreatment;
  composition?: TextComposition;
  stepNumber?: number | string;
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
  treatment = "word_pop",
  composition = "centered",
  stepNumber = "01",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text || text.trim().length === 0) return null;

  const lines = parseSubtitleLines(text);
  const baseFontSize = fontSize || token.typography.baseFontSize;

  let globalWordIndex = 0;

  // -------------------------------------------------------------
  // 1. TREATMENT: TYPEWRITER (KÝ TỰ GÕ CHỮ)
  // -------------------------------------------------------------
  if (treatment === "typewriter") {
    const totalChars = text.length;
    const charsToShow = Math.min(totalChars, Math.floor((frame / fps) * 24));
    const isCursorVisible = Math.floor(frame / 8) % 2 === 0;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "4px 8px",
        }}
      >
        <span
          style={{
            fontFamily: token.typography.fontFamily,
            fontWeight: token.typography.fontWeight,
            fontSize: `${baseFontSize}px`,
            lineHeight: token.typography.lineHeight,
            color: token.colors.primaryText,
            letterSpacing: "1px",
            whiteSpace: "pre-wrap",
            textAlign: "center",
          }}
        >
          {text.slice(0, charsToShow)}
          <span
            style={{
              opacity: isCursorVisible ? 1 : 0,
              color: token.colors.accentText,
              fontWeight: 900,
            }}
          >
            _
          </span>
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. TREATMENT: TRACKING EXPANSION (DÃN CÁCH KÝ TỰ SANG TRỌNG)
  // -------------------------------------------------------------
  if (treatment === "tracking_expand") {
    const expandProgress = spring({
      frame,
      fps,
      config: { damping: 20, stiffness: 120 },
    });
    const letterSpacingPx = interpolate(expandProgress, [0, 1], [0, 6]);
    const opacityVal = interpolate(frame, [0, 8], [0, 1], {
      extrapolateRight: "clamp",
    });

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
          width: "100%",
          opacity: opacityVal,
        }}
      >
        {lines.map((line, idx) => (
          <span
            key={idx}
            style={{
              fontFamily: token.typography.fontFamily,
              fontWeight: token.typography.fontWeight,
              fontSize: `${idx === lines.length - 1 ? Math.round(baseFontSize * 1.15) : baseFontSize}px`,
              letterSpacing: `${letterSpacingPx}px`,
              color: idx === lines.length - 1 ? token.colors.accentText : token.colors.primaryText,
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            {line}
          </span>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 3. COMPOSITION: BRACKETED SPEC ([ NỘI DUNG ])
  // -------------------------------------------------------------
  if (composition === "bracketed_spec") {
    const popScale = spring({
      frame,
      fps,
      config: { damping: 14, stiffness: 180 },
    });
    return (
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          transform: `scale(${popScale})`,
        }}
      >
        <span style={{ fontSize: `${baseFontSize * 1.3}px`, color: token.colors.accentText, fontWeight: 300 }}>
          [
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          {lines.map((l, i) => (
            <span
              key={i}
              style={{
                fontFamily: token.typography.fontFamily,
                fontWeight: token.typography.fontWeight,
                fontSize: `${baseFontSize * 0.95}px`,
                color: token.colors.primaryText,
                letterSpacing: "1px",
              }}
            >
              {l}
            </span>
          ))}
        </div>
        <span style={{ fontSize: `${baseFontSize * 1.3}px`, color: token.colors.accentText, fontWeight: 300 }}>
          ]
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 4. COMPOSITION: STEP FLOW (KÈM STEP BADGE 01, 02...)
  // -------------------------------------------------------------
  if (composition === "step_flow") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
        }}
      >
        <StepBadge stepNumber={stepNumber} color={token.colors.accentText} />
        {lines.map((line, idx) => (
          <span
            key={idx}
            style={{
              fontFamily: token.typography.fontFamily,
              fontWeight: token.typography.fontWeight,
              fontSize: `${baseFontSize}px`,
              color: idx === 0 ? token.colors.primaryText : token.colors.accentText,
              textAlign: "center",
            }}
          >
            {line}
          </span>
        ))}
      </div>
    );
  }

  // -------------------------------------------------------------
  // 5. COMPOSITION: EDITORIAL EYEBROW (DÒNG NHỎ TRÊN + HEADLINE LỚN)
  // -------------------------------------------------------------
  if (composition === "editorial_eyebrow" && lines.length >= 2) {
    const eyebrow = lines[0];
    const headline = lines.slice(1).join(" ");
    const eyebrowProgress = spring({ frame, fps, config: { damping: 16, stiffness: 140 } });
    const headlineProgress = spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 14, stiffness: 160 } });

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "4px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 800,
            fontSize: `${Math.round(baseFontSize * 0.58)}px`,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: token.colors.accentText,
            opacity: eyebrowProgress,
            transform: `translateY(${interpolate(eyebrowProgress, [0, 1], [-8, 0])}px)`,
          }}
        >
          {eyebrow}
        </span>
        <span
          style={{
            fontFamily: token.typography.fontFamily,
            fontWeight: token.typography.fontWeight,
            fontSize: `${Math.round(baseFontSize * 1.25)}px`,
            lineHeight: 1.15,
            color: token.colors.primaryText,
            opacity: headlineProgress,
            transform: `scale(${headlineProgress})`,
          }}
        >
          {headline}
        </span>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 6. DEFAULT / MASKED SLIDE / OUTLINED PUNCH / WORD POP
  // -------------------------------------------------------------
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

        let lineScale = 1.0;
        if (lines.length > 1) {
          if (lineWords.length <= 2 && lines.length === 2) {
            lineScale = 1.20;
          } else if (lineIdx === lines.length - 1) {
            lineScale = 1.15;
          } else if (lineWords.length >= 4) {
            lineScale = 0.94;
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
              overflow: treatment === "masked_slide" ? "hidden" : "visible",
            }}
          >
            {lineWords.map((word, wIdx) => {
              const currentWordIndex = globalWordIndex++;

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

              // TREATMENT: MASKED SLIDE (Trồi lên từ mask vô hình)
              if (treatment === "masked_slide") {
                const slideSpring = spring({
                  frame: Math.max(0, frame - currentWordIndex * 2.5),
                  fps,
                  config: { damping: 16, stiffness: 180 },
                });
                const translateY = interpolate(slideSpring, [0, 1], [45, 0]);

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
                      transform: `translateY(${translateY}px)`,
                      textShadow,
                    }}
                  >
                    {word}
                  </span>
                );
              }

              // TREATMENT: OUTLINED PUNCH (Viền rỗng biến thành chữ đặc)
              if (treatment === "outlined_punch") {
                const punchSpring = spring({
                  frame: Math.max(0, frame - currentWordIndex * 3),
                  fps,
                  config: { damping: 12, stiffness: 220 },
                });
                const isSolid = punchSpring > 0.6;

                return (
                  <span
                    key={wIdx}
                    style={{
                      display: "inline-block",
                      fontFamily: token.typography.fontFamily,
                      fontWeight: 900,
                      fontSize: `${currentLineFontSize}px`,
                      lineHeight: token.typography.lineHeight,
                      textTransform: "uppercase",
                      color: isSolid ? wordColor : "transparent",
                      WebkitTextStroke: isSolid ? "none" : `2px ${wordColor}`,
                      transform: `scale(${punchSpring})`,
                      textShadow,
                    }}
                  >
                    {word}
                  </span>
                );
              }

              // DEFAULT: WORD POP
              const wordMotion = MotionComposer.evaluateWord(
                frame,
                currentWordIndex,
                fps,
                token.motion.wordStaggerFrames,
                intensity,
                token.motion.springConfig
              );

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
