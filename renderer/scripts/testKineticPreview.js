/**
 * Test Kinetic Preview Generator
 * Generates sample multi-frame PNG sequence for Typewriter reveal on Khung Sét Vàng.
 */

const fs = require("fs");
const path = require("path");
const { generateKineticCardSequence } = require("./kineticCardEngine");

console.log("==================================================");
console.log("   TESTING KINETIC CARD ENGINE (PNG SEQUENCE)     ");
console.log("==================================================");

const res = generateKineticCardSequence({
  sceneId: "test_kinetic_001",
  text: "LƯU NGAY CHO\nCHUYẾN ĐI SẮP TỚI!",
  presetName: "vibrant_yellow_lightning_sticker",
  textEffect: "Typewriter",
  durationS: 5.0,
});

console.log("✅ Kinetic Card Sequence Generated Successfully!");
console.log(" - Sequence Dir:", res.sequenceDir);
console.log(" - Sequence Pattern:", res.sequencePattern);
console.log(" - Total Frames:", res.totalFrames);
console.log(" - Card WxH:", `${res.cardW}x${res.cardH}`);
console.log(" - Overlay X,Y:", `${res.overlayX},${res.overlayY}`);
