/**
 * Standalone Test Preview Generator for Vibrant Yellow Sticker Frame
 * Applies -15 degrees left tilt rotation + standard base font size + slight boost for short lines.
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

// Exact text from scene_001
const line1 = "KUALA LUMPUR VỀ ĐÊM";
const line2 = "SỐNG ĐỘNG THẾ NÀO?";

const textFile1 = path.join(TEMP_DIR, "preview_sticker_v3_line1.txt");
const textFile2 = path.join(TEMP_DIR, "preview_sticker_v3_line2.txt");

fs.writeFileSync(textFile1, line1, "utf8");
fs.writeFileSync(textFile2, line2, "utf8");

const cardPath = path.join(CARDS_DIR, "vibrant_yellow_sticker.png");
const outputPath = path.join(TEMP_DIR, "test_sticker_preview_v3.png");

const fontFile = "/System/Library/Fonts/HelveticaNeue.ttc";

// Tilt angle -15 degrees (left tilt)
const tiltDeg = -15;
const tiltRad = ((tiltDeg * Math.PI) / 180).toFixed(4);

// Standard base font size 68px, slight boost (+6px) for short lines
const fs1 = line1.length < 14 ? 74 : 68;
const fs2 = line2.length < 14 ? 74 : 68;

const filterGraph = `scale=950:475,drawtext=textfile='${textFile1.replace(/'/g, "'\\''")}':fontfile='${fontFile}':fontcolor=0x111111:fontsize=${fs1}:borderw=2:bordercolor=0x111111@0.8:shadowx=0:shadowy=3:shadowcolor=0x000000@0.3:text_align=C:x=(w-text_w)/2:y=(h/2)-55,drawtext=textfile='${textFile2.replace(/'/g, "'\\''")}':fontfile='${fontFile}':fontcolor=0x111111:fontsize=${fs2}:borderw=2:bordercolor=0x111111@0.8:shadowx=0:shadowy=3:shadowcolor=0x000000@0.3:text_align=C:x=(w-text_w)/2:y=(h/2)+20,rotate=${tiltRad}:c=none:ow=rotw(${tiltRad}):oh=roth(${tiltRad})`;

console.log(`[PreviewStickerV3] Rendering Khung Sticker Vàng with -15 deg left tilt:`);
console.log(`Line 1 (${line1.length} chars, Font ${fs1}px): "${line1}"`);
console.log(`Line 2 (${line2.length} chars, Font ${fs2}px): "${line2}"`);

execFileSync("ffmpeg", ["-hide_banner", "-y", "-i", cardPath, "-vf", filterGraph, "-vframes", "1", outputPath], { stdio: "inherit" });
console.log("[PreviewStickerV3] ✅ Successfully generated test_sticker_preview_v3.png!");
