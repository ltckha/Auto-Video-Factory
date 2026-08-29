import React from "react";
import { Composition, AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import { KineticSubtitleCard } from "./components/KineticSubtitleCard";

export const SampleScene: React.FC<{
  videoSrc?: string;
  subtitle: string;
  preset: "minimal_glass_card" | "vibrant_yellow_sticker" | "warning_red_badge" | "vibrant_yellow_lightning_sticker";
}> = ({
  videoSrc = staticFile("sample_bg.mp4"),
  subtitle = "BÍ MẬT DƯỚI LÁ GAI KHỔNG LỒ",
  preset = "minimal_glass_card",
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0F172A" }}>
      {videoSrc ? (
        <OffthreadVideo
          src={videoSrc}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <AbsoluteFill
          style={{
            background: "linear-gradient(180deg, #1E293B 0%, #0F172A 100%)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ color: "#64748B", fontSize: "36px", fontFamily: "sans-serif" }}>
            [ Background Video Layer 1080x1920 ]
          </div>
        </AbsoluteFill>
      )}

      {/* Remotion Kinetic Subtitle Card Overlay */}
      <KineticSubtitleCard
        text={subtitle}
        preset={preset}
        position="top"
        displayDurationS={2.5}
      />
    </AbsoluteFill>
  );
};

import { FullTimelineVideo } from "./compositions/FullTimelineVideo";
import { MotionCatalogPreview } from "./compositions/MotionCatalogPreview";
import { adaptTimelineToRemotion } from "./adapters/timelineAdapter";
import prodTimelineJson from "./adapters/production_short01.json";

const { totalDurationFrames: prodTotalFrames } = adaptTimelineToRemotion(prodTimelineJson as any, 30);

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Anton&family=Be+Vietnam+Pro:ital,wght@0,600;0,800;0,900;1,800&family=Montserrat:ital,wght@0,800;0,900;1,900&family=Paytone+One&family=Playfair+Display:ital,wght@0,700;0,900;1,700&display=swap');
      `}</style>
      <Composition
        id="ProductionShort01"
        component={FullTimelineVideo}
        durationInFrames={prodTotalFrames || 960}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="MotionCatalogPreview"
        component={MotionCatalogPreview}
        durationInFrames={540}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="KineticCardGlassDemo"
        component={SampleScene}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          subtitle: "BÍ MẬT DƯỚI LÁ GAI KHỔNG LỒ",
          preset: "minimal_glass_card",
        }}
      />
      <Composition
        id="KineticCardStickerDemo"
        component={SampleScene}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          subtitle: "ĐÔI GIÀY CŨ CÒN CỨU ĐƯỢC?",
          preset: "vibrant_yellow_sticker",
        }}
      />
      <Composition
        id="KineticCardBadgeDemo"
        component={SampleScene}
        durationInFrames={120}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          subtitle: "CẢNH BÁO: ĐỪNG MÀI DAO KIỂU NÀY",
          preset: "warning_red_badge",
        }}
      />
    </>
  );
};
