import React from "react";
import { AbsoluteFill } from "remotion";
import { HandMark } from "../materials/procedural/HandMark";
import { StitchingThread } from "../materials/procedural/StitchingThread";
import { KraftTape } from "../materials/procedural/KraftTape";
import { EmbossStamp } from "../materials/procedural/EmbossStamp";
import { DimensionLine } from "../materials/procedural/DimensionLine";
import { LightSweep } from "../materials/procedural/LightSweep";
import { PaperClip } from "../materials/procedural/PaperClip";
import { BeforeAfterSlider } from "../materials/procedural/BeforeAfterSlider";
import { PriceTagBadge } from "../materials/procedural/PriceTagBadge";
import { TornPaperBackground } from "../materials/procedural/TornPaperBackground";
import { SurfaceGrainOverlay } from "../materials/procedural/SurfaceGrainOverlay";

export const MaterialCatalogPreview: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#16120E",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "45px 30px",
        color: "#FFFFFF",
        fontFamily: "Be Vietnam Pro, sans-serif",
      }}
    >
      {/* 1. Subtle Organic Surface Grain */}
      <SurfaceGrainOverlay opacity={0.06} />

      {/* 2. Specular Light Sweep across full frame */}
      <LightSweep delayFrames={6} durationFrames={35} />

      {/* Header */}
      <div style={{ textAlign: "center", zIndex: 60, marginTop: "10px" }}>
        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "40px",
            color: "#FFE600",
            margin: 0,
            letterSpacing: "2px",
          }}
        >
          CREATIVE MATERIAL LAYER
        </h1>
        <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.7)", margin: "6px 0 0 0" }}>
          Full Tactile & Sensory Primitives (100% Remotion Procedural)
        </p>
      </div>

      {/* Section 1: Artisan Saddle Stitching */}
      <div
        style={{
          position: "relative",
          width: "92%",
          height: "95px",
          backgroundColor: "#2B1E17",
          borderRadius: "12px",
          border: "1px solid #4A3528",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "14px 20px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 800, color: "#E6C687" }}>
          1. SADDLE STITCHING (ĐƯỜNG MAY CHỈ XIÊN THỦ CÔNG)
        </span>
        <div style={{ position: "relative", height: "24px", width: "100%", display: "flex", alignItems: "center" }}>
          <StitchingThread length={850} delayFrames={4} stitchColor="#FFE600" />
        </div>
      </div>

      {/* Section 2: Hand-Drawn Marks */}
      <div
        style={{
          position: "relative",
          width: "92%",
          height: "140px",
          backgroundColor: "#2B1E17",
          borderRadius: "12px",
          border: "1px solid #4A3528",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "10px 16px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        {/* Circle Mark */}
        <div style={{ position: "relative", width: "130px", height: "80px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: "15px", fontWeight: 900, color: "#FFFFFF" }}>ĐỤC LỖ DA</span>
          <HandMark type="circle" color="#FFE600" width={130} height={75} delayFrames={6} />
        </div>

        {/* Arrow Mark */}
        <div style={{ position: "relative", width: "100px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HandMark type="arrow" color="#FFE600" width={90} height={55} delayFrames={8} />
        </div>

        {/* Check Mark */}
        <div style={{ position: "relative", width: "80px", height: "60px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <HandMark type="check_mark" color="#4ADE80" width={70} height={50} delayFrames={10} />
        </div>
      </div>

      {/* Section 3: Torn Paper + Paper Clip + Washi Tape + Deboss Stamp */}
      <div
        style={{
          position: "relative",
          width: "92%",
          height: "170px",
          backgroundColor: "#2B1E17",
          borderRadius: "12px",
          border: "1px solid #4A3528",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "12px 16px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        {/* Torn Paper Card with Paper Clip */}
        <TornPaperBackground width={210} height={105} delayFrames={4}>
          <PaperClip style={{ top: "-18px", left: "15px" }} delayFrames={6} />
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <span style={{ color: "#332211", fontWeight: 900, fontSize: "14px" }}>DA BÒ THẬT 100%</span>
            <span style={{ color: "#886644", fontWeight: 700, fontSize: "10px" }}>YÊN HANDMADE LEATHER</span>
          </div>
        </TornPaperBackground>

        {/* Emboss Deboss Stamp */}
        <div style={{ position: "relative", width: "110px", height: "110px", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <EmbossStamp text="HANDMADE" subtext="CHẤT LƯỢNG CAO" variant="circular_seal" color="#FFE600" size={105} delayFrames={12} />
        </div>
      </div>

      {/* Section 4: Before & After Comparison Slider */}
      <div
        style={{
          position: "relative",
          width: "92%",
          height: "110px",
          backgroundColor: "#2B1E17",
          borderRadius: "12px",
          border: "1px solid #4A3528",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <BeforeAfterSlider beforeLabel="DA CŨ BẨN" afterLabel="PHỤC HỒI NÉT" width={420} delayFrames={8} />
      </div>

      {/* Section 5: Commercial Price Tag Badge & Dimension Line */}
      <div
        style={{
          position: "relative",
          width: "92%",
          height: "140px",
          backgroundColor: "#2B1E17",
          borderRadius: "12px",
          border: "1px solid #4A3528",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          padding: "10px 16px",
          marginBottom: "10px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
        }}
      >
        <PriceTagBadge priceText="850.000" originalPriceText="1.200.000" badgeLabel="GIÁ ƯU ĐÃI" delayFrames={6} />
        <DimensionLine valueText="1.8 mm" labelText="ĐỘ DÀY DA" length={160} color="#FFE600" delayFrames={10} />
      </div>
    </AbsoluteFill>
  );
};
