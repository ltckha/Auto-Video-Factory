import React from "react";
import { interpolate } from "remotion";
import { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

export interface PaperRipPresentationProps extends Record<string, unknown> {
  direction?: "from-left" | "from-right";
}

const PaperRipPresentation: React.FC<
  TransitionPresentationComponentProps<PaperRipPresentationProps>
> = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const isEntering = presentationDirection === "entering";
  const fromRight = passedProps?.direction === "from-right";

  const progressPercent = interpolate(presentationProgress, [0, 1], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const p = progressPercent;
  const p1 = Math.min(100, Math.max(0, p - 3));
  const p2 = Math.min(100, Math.max(0, p + 2));
  const p3 = Math.min(100, Math.max(0, p - 2));
  const p4 = Math.min(100, Math.max(0, p + 3));

  const clipPath = fromRight
    ? `polygon(${100 - p}% 0%, 100% 0%, 100% 100%, ${100 - p4}% 100%, ${100 - p3}% 75%, ${100 - p2}% 50%, ${100 - p1}% 25%)`
    : `polygon(0% 0%, ${p}% 0%, ${p1}% 25%, ${p2}% 50%, ${p3}% 75%, ${p4}% 100%, 0% 100%)`;

  const style: React.CSSProperties = isEntering
    ? {
        width: "100%",
        height: "100%",
        clipPath,
        WebkitClipPath: clipPath,
        filter: "drop-shadow(0 0 15px rgba(0,0,0,0.5))",
      }
    : {
        width: "100%",
        height: "100%",
      };

  return <div style={style}>{children}</div>;
};

export const paperRip = (
  props?: PaperRipPresentationProps
): TransitionPresentation<PaperRipPresentationProps> => {
  return {
    component: PaperRipPresentation,
    props: props ?? {},
  };
};
