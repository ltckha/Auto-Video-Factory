import React from "react";
import { interpolate } from "remotion";
import { TransitionPresentation, TransitionPresentationComponentProps } from "@remotion/transitions";

export interface IrisCirclePresentationProps extends Record<string, unknown> {
  type?: "open" | "close";
}

const IrisCirclePresentation: React.FC<
  TransitionPresentationComponentProps<IrisCirclePresentationProps>
> = ({ children, presentationProgress, presentationDirection, passedProps }) => {
  const isEntering = presentationDirection === "entering";
  const isOpen = passedProps?.type !== "close";

  // Radius expands from 0% to 150% (covering the 9:16 screen diagonal)
  const radius = interpolate(
    presentationProgress,
    [0, 1],
    isOpen ? [0, 150] : [150, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    }
  );

  const style: React.CSSProperties = isEntering
    ? {
        width: "100%",
        height: "100%",
        clipPath: `circle(${radius}% at 50% 50%)`,
        WebkitClipPath: `circle(${radius}% at 50% 50%)`,
      }
    : {
        width: "100%",
        height: "100%",
      };

  return <div style={style}>{children}</div>;
};

export const irisCircle = (
  props?: IrisCirclePresentationProps
): TransitionPresentation<IrisCirclePresentationProps> => {
  return {
    component: IrisCirclePresentation,
    props: props ?? {},
  };
};
