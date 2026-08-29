import React from "react";
import { AbsoluteFill, Series } from "remotion";
import { SubtitleCard } from "../components/SubtitleCard";
import { asmrCraftToken } from "../styles/asmrCraft";
import { cinematicTravelToken } from "../styles/cinematicTravel";
import { viralTikTokToken } from "../styles/viralTikTok";
import { luxuryEditorialToken } from "../styles/luxuryEditorial";
import { foodSocialToken, productCommercialToken } from "../styles/foodAndProduct";

export const MotionCatalogPreview: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#070A13" }}>
      <Series>
        {/* Style 1: ASMR Craft & Leather (YEN Leather Brand DNA) */}
        <Series.Sequence durationInFrames={90}>
          <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "absolute", top: "70px", color: "#94A3B8", fontSize: "24px", fontFamily: "sans-serif", letterSpacing: "1px" }}>
              [ 01: ASMR CRAFT — YEN LEATHER DNA (INTENSITY 0.35) ]
            </div>
            <SubtitleCard
              text="ĐÔI GIÀY CŨ CÒN CỨU ĐƯỢC?"
              token={asmrCraftToken}
              position="center"
              displayDurationS={2.8}
              intensity={0.35}
            />
          </AbsoluteFill>
        </Series.Sequence>

        {/* Style 2: Cinematic Travel Da Lat */}
        <Series.Sequence durationInFrames={90}>
          <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "absolute", top: "70px", color: "#94A3B8", fontSize: "24px", fontFamily: "sans-serif", letterSpacing: "1px" }}>
              [ 02: CINEMATIC TRAVEL — ĐÀ LẠT NIGHT (INTENSITY 0.45) ]
            </div>
            <SubtitleCard
              text="LƯỢN PHỐ ĐÊM CỰC CHILL"
              token={cinematicTravelToken}
              position="center"
              displayDurationS={2.8}
              intensity={0.45}
            />
          </AbsoluteFill>
        </Series.Sequence>

        {/* Style 3: Luxury Vogue Editorial */}
        <Series.Sequence durationInFrames={90}>
          <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "absolute", top: "70px", color: "#94A3B8", fontSize: "24px", fontFamily: "sans-serif", letterSpacing: "1px" }}>
              [ 03: LUXURY EDITORIAL — BOOTS & VOGUE (INTENSITY 0.30) ]
            </div>
            <SubtitleCard
              text="NGHỆ THUẬT CHẾ TÁC DA Ý"
              token={luxuryEditorialToken}
              position="center"
              displayDurationS={2.8}
              intensity={0.30}
            />
          </AbsoluteFill>
        </Series.Sequence>

        {/* Style 4: Viral TikTok / CapCut */}
        <Series.Sequence durationInFrames={90}>
          <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "absolute", top: "70px", color: "#94A3B8", fontSize: "24px", fontFamily: "sans-serif", letterSpacing: "1px" }}>
              [ 04: VIRAL TIKTOK — IMPACT HOOK (INTENSITY 0.85) ]
            </div>
            <SubtitleCard
              text="BÍ MẬT NÀY ÍT NGƯỜI BIẾT"
              token={viralTikTokToken}
              position="center"
              displayDurationS={2.8}
              intensity={0.85}
            />
          </AbsoluteFill>
        </Series.Sequence>

        {/* Style 5: Food & Culinary Social */}
        <Series.Sequence durationInFrames={90}>
          <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "absolute", top: "70px", color: "#94A3B8", fontSize: "24px", fontFamily: "sans-serif", letterSpacing: "1px" }}>
              [ 05: FOOD SOCIAL — WARM AMBER (INTENSITY 0.55) ]
            </div>
            <SubtitleCard
              text="HƯƠNG VỊ BÁNH ƯỚT LÒNG GÀ"
              token={foodSocialToken}
              position="center"
              displayDurationS={2.8}
              intensity={0.55}
            />
          </AbsoluteFill>
        </Series.Sequence>

        {/* Style 6: Product & Commercial CTA */}
        <Series.Sequence durationInFrames={90}>
          <AbsoluteFill style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ position: "absolute", top: "70px", color: "#94A3B8", fontSize: "24px", fontFamily: "sans-serif", letterSpacing: "1px" }}>
              [ 06: PRODUCT COMMERCIAL — USP & CTA (INTENSITY 0.70) ]
            </div>
            <SubtitleCard
              text="ƯU ĐÃI ĐẶC BIỆT HÔM NAY"
              token={productCommercialToken}
              position="center"
              displayDurationS={2.8}
              intensity={0.70}
            />
          </AbsoluteFill>
        </Series.Sequence>
      </Series>
    </AbsoluteFill>
  );
};
