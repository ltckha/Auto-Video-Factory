import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { MarkType } from "../types";

export interface HandMarkProps {
  type: MarkType;
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  delayFrames?: number;
  style?: React.CSSProperties;
}

export const HandMark: React.FC<HandMarkProps> = ({
  type = "circle",
  color = "#FFE600",
  width = 240,
  height = 100,
  strokeWidth = 4,
  delayFrames = 5,
  style = {},
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (type === "none" || type === "dimension") return null;

  // Spring animation for drawing in the SVG stroke
  const progress = spring({
    frame: Math.max(0, frame - delayFrames),
    fps,
    config: {
      damping: 18,
      stiffness: 85,
      mass: 0.8,
    },
  });

  const renderMarkContent = () => {
    switch (type) {
      case "circle": {
        const pathData = `
          M 25,50 
          C 20,20 80,10 130,12 
          C 185,14 235,28 230,55 
          C 225,82 170,92 115,90 
          C 55,88 15,75 22,46
          C 26,30 50,22 75,18
        `;
        const pathLength = 650;
        const dashOffset = pathLength * (1 - Math.min(1, progress));

        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 250 100"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
              style={{ filter: "drop-shadow(1px 2px 0px rgba(0,0,0,0.25))" }}
            />
          </svg>
        );
      }

      case "arrow": {
        const pathData = "M 10,75 C 60,85 140,70 190,25";
        const pathLength = 220;
        const dashOffset = pathLength * (1 - Math.min(1, progress));
        const arrowheadProgress = Math.max(0, (progress - 0.7) / 0.3);

        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 220 90"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />
            <path
              d="M 165,22 L 190,25"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={arrowheadProgress}
            />
            <path
              d="M 182,45 L 190,25"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              opacity={arrowheadProgress}
            />
          </svg>
        );
      }

      case "underline": {
        const pathData = "M 5,20 C 50,25 100,16 150,22 C 200,28 250,18 295,21";
        const pathLength = 300;
        const dashOffset = pathLength * (1 - Math.min(1, progress));

        return (
          <svg
            width={width}
            height={30}
            viewBox="0 0 300 30"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />
          </svg>
        );
      }

      case "highlight": {
        const scaleX = Math.min(1, progress);
        return (
          <div
            style={{
              width: `${width}px`,
              height: `${height * 0.35}px`,
              backgroundColor: color,
              opacity: 0.45,
              borderRadius: "4px",
              transform: `scaleX(${scaleX}) rotate(-1deg)`,
              transformOrigin: "left center",
              mixBlendMode: "multiply",
            }}
          />
        );
      }

      case "check_mark": {
        const pathData = "M 10,35 L 30,55 L 75,12";
        const pathLength = 100;
        const dashOffset = pathLength * (1 - Math.min(1, progress));

        return (
          <svg
            width={width * 0.5}
            height={height * 0.7}
            viewBox="0 0 85 65"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth * 1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
              style={{ filter: "drop-shadow(1px 2px 2px rgba(0,0,0,0.3))" }}
            />
          </svg>
        );
      }

      case "cross_mark": {
        const pathLength = 50;
        const dashOffset = pathLength * (1 - Math.min(1, progress));

        return (
          <svg
            width={width * 0.4}
            height={height * 0.6}
            viewBox="0 0 50 50"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d="M 10,10 L 40,40"
              stroke={color}
              strokeWidth={strokeWidth * 1.5}
              strokeLinecap="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />
            <path
              d="M 40,10 L 10,40"
              stroke={color}
              strokeWidth={strokeWidth * 1.5}
              strokeLinecap="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />
          </svg>
        );
      }

      case "scribble": {
        // Quick energetic hand-drawn scribble
        const pathData = "M 5,25 C 25,5 35,45 60,15 C 85,45 100,5 125,35 C 150,10 165,40 190,20";
        const pathLength = 280;
        const dashOffset = pathLength * (1 - Math.min(1, progress));

        return (
          <svg
            width={width}
            height={height * 0.5}
            viewBox="0 0 200 50"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />
          </svg>
        );
      }

      case "bracket_box": {
        // Hand-drawn rough rectangular bracket box
        const pathData = "M 5,20 L 5,5 L 195,5 L 195,75 L 5,75 L 5,60";
        const pathLength = 500;
        const dashOffset = pathLength * (1 - Math.min(1, progress));

        return (
          <svg
            width={width}
            height={height}
            viewBox="0 0 200 80"
            fill="none"
            style={{ overflow: "visible" }}
          >
            <path
              d={pathData}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={pathLength}
              strokeDashoffset={dashOffset}
            />
          </svg>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        pointerEvents: "none",
        zIndex: 40,
        ...style,
      }}
    >
      {renderMarkContent()}
    </div>
  );
};
