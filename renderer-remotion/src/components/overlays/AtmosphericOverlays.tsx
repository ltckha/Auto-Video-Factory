import React from "react";
import { interpolate, useCurrentFrame } from "remotion";

export const FilmGrainOverlay: React.FC<{
  opacity?: number;
}> = ({ opacity = 0.08 }) => {
  const frame = useCurrentFrame();
  // Subtle frame jitter for organic film noise
  const offsetX = (frame * 17) % 100;
  const offsetY = (frame * 23) % 100;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        opacity,
        pointerEvents: "none",
        mixBlendMode: "overlay",
        zIndex: 50,
        backgroundImage: `radial-gradient(circle at ${offsetX}% ${offsetY}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
      }}
    />
  );
};

export const WarmLightLeakOverlay: React.FC<{
  intensity?: number;
}> = ({ intensity = 0.4 }) => {
  const frame = useCurrentFrame();

  // Slow subtle drift of golden sunlight across the top right
  const driftX = interpolate(Math.sin(frame / 45), [-1, 1], [65, 85]);
  const driftY = interpolate(Math.cos(frame / 45), [-1, 1], [0, 20]);
  const alpha = interpolate(Math.sin(frame / 30), [-1, 1], [intensity * 0.7, intensity * 1.1]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 60,
        mixBlendMode: "screen",
        background: `radial-gradient(circle at ${driftX}% ${driftY}%, rgba(251, 191, 36, ${alpha}) 0%, rgba(245, 158, 11, ${alpha * 0.5}) 35%, transparent 70%)`,
      }}
    />
  );
};

export const ShimmerGlowOverlay: React.FC<{
  delayFrames?: number;
  durationFrames?: number;
}> = ({ delayFrames = 10, durationFrames = 25 }) => {
  const frame = useCurrentFrame();

  if (frame < delayFrames || frame > delayFrames + durationFrames) {
    return null;
  }

  const progress = (frame - delayFrames) / durationFrames;
  const translateX = interpolate(progress, [0, 1], [-100, 200]);

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius: "inherit",
        pointerEvents: "none",
        zIndex: 20,
      }}
    >
      <div
        style={{
          width: "40%",
          height: "100%",
          background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)",
          transform: `translateX(${translateX}%) skewX(-20deg)`,
        }}
      />
    </div>
  );
};
