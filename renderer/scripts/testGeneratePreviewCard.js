/**
 * Standalone Test Preview Generator for Auto-Video-Factory
 * Reads exact timeline JSON text and renders per-line dynamic font sizing preview image.
 */

const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..");
const CARDS_DIR = path.join(ROOT, "assets/overlays/cards");
const TEMP_DIR = path.join(ROOT, "temp");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

// 1. Read exact text from timeline JSON
const jsonPath = "/Volumes/Media/Auto-Video-Factory/archive/IMG_20251029_200932/IMG_20251029_200932.json";
let sceneText = "LƯU NGAY CHO\nCHUYẾN ĐI SẮP TỚI!";

if (fs.existsSync(jsonPath)) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    const scene4 = data.timeline.find((s) => s.scene_id === "scene_004");
    if (scene4 && scene4.subtitle) {
      sceneText = scene4.subtitle;
    }
  } catch (e) {}
}

const lines = sceneText.split("\n");
const line1 = lines[0] || "LƯU NGAY CHO";
const line2 = lines[1] || "CHUYẾN ĐI SẮP TỚI!";

// Create UTF-8 text files for each line to avoid any shell encoding glitches
const textFile1 = path.join(TEMP_DIR, "preview_line1.txt");
const textFile2 = path.join(TEMP_DIR, "preview_line2.txt");

fs.writeFileSync(textFile1, line1, "utf8");
fs.writeFileSync(textFile2, line2, "utf8");

const cardPath = path.join(CARDS_DIR, "vibrant_yellow_lightning_sticker.png");
const outputPath = path.join(TEMP_DIR, "test_lightning_preview_v2.png");

// 100% Clean Vietnamese UTF-8 Font: HelveticaNeue Bold or Arial
const fontFile = "/System/Library/Fonts/HelveticaNeue.ttc";

// Calculate per-line font size:
// Line 1 has fewer characters (12 chars) -> Font size 84px (BIGGER!)
// Line 2 has more characters (18 chars) -> Font size 62px (Fits width!)
const filterGraph = `scale=950:475,drawtext=textfile='${textFile1.replace(/'/g, "'\\''")}':fontfile='${fontFile}':fontcolor=0xFFD600:fontsize=84:borderw=3:bordercolor=0x111111@0.95:shadowx=0:shadowy=4:shadowcolor=0x000000@0.6:text_align=C:x=(w-text_w)/2:y=(h/2)-65,drawtext=textfile='${textFile2.replace(/'/g, "'\\''")}':fontfile='${fontFile}':fontcolor=0xFFD600:fontsize=62:borderw=3:bordercolor=0x111111@0.95:shadowx=0:shadowy=4:shadowcolor=0x000000@0.6:text_align=C:x=(w-text_w)/2:y=(h/2)+25`;

console.log(`[PreviewTest] Rendering scene_004 exact text onto Khung Sét Vàng:`);
console.log(`Line 1 (${line1.length} chars, Font 84px): "${line1}"`);
console.log(`Line 2 (${line2.length} chars, Font 62px): "${line2}"`);

execFileSync("ffmpeg", ["-hide_banner", "-y", "-i", cardPath, "-vf", filterGraph, "-vframes", "1", outputPath], { stdio: "inherit" });
console.log("[PreviewTest] ✅ Successfully generated test_lightning_preview_v2.png!");
