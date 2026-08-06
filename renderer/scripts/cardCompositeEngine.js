/**
 * Pre-Composite Card & Text Canvas Engine for Auto-Video-Factory (IDEA-007)
 * Draws Vietnamese subtitle text directly into clear frame card PNG images,
 * outputting a single pre-rendered transparent composite PNG file.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { resolveCardTemplate } = require("./overlayAssetResolver");
const { computeCompleteSubtitleLayout } = require("./subtitleLayoutEngine");

const ROOT = path.resolve(__dirname, "..");
const TEMP_DIR = path.join(ROOT, "temp");
const CONFIG_DIR = path.join(ROOT, "config");
const PROFILES_PATH = path.join(CONFIG_DIR, "cardVisionProfiles.json");

function loadVisionProfiles() {
  if (fs.existsSync(PROFILES_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}

/**
 * Calculate dynamic auto-fit font size based on text character count, line count, and per-card vision profile
 */
function autoFitFontSize(lines, containerW, containerH, profile = {}) {
  const lineCount = Math.max(1, lines.length);
  const maxLineLen = Math.max(...lines.map((l) => l.length), 1);

  const fillW = profile.fill_ratio_w || 0.82;
  const fillH = profile.fill_ratio_h || 0.72;
  const maxFs = profile.max_font_size || 76;
  const minFs = profile.min_font_size || 38;

  // Safe scaling for bold Vietnamese text with diacritics (0.72 * fontSize per char width)
  const heightBasedSize = Math.floor((containerH * fillH) / (lineCount * 1.15));
  const widthBasedSize = Math.floor((containerW * fillW) / (maxLineLen * 0.72));

  const fontSize = Math.min(heightBasedSize, widthBasedSize);
  return Math.max(minFs, Math.min(maxFs, fontSize));
}

const { generateKineticCardSequence } = require("./kineticCardEngine");

/**
 * Generate a pre-composite transparent PNG file combining the frame card + centered text
 * @param {Object} params
 * @returns {{ compositePath: string, sequencePattern?: string, overlayX: number, overlayY: number, cardW: number, cardH: number }}
 */
function generateCompositeCardImage(params) {
  const {
    sceneId = "scene_001",
    text = "",
    presetName = "vibrant_sticker_label",
    textEffect = "Typewriter",
    positionAnchor = "top",
    durationS = 5.0,
    videoW = 1080,
    videoH = 1920,
  } = params;

  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  // If animated text effect is requested, delegate to kineticCardEngine
  if (textEffect && textEffect !== "none" && textEffect !== "static") {
    try {
      const seqRes = generateKineticCardSequence({
        sceneId,
        text,
        presetName,
        textEffect,
        durationS,
        videoW,
        videoH,
      });

      const firstFrame = path.join(seqRes.sequenceDir, "frame_001.png");
      return {
        compositePath: firstFrame,
        sequencePattern: seqRes.sequencePattern,
        overlayX: seqRes.overlayX,
        overlayY: seqRes.overlayY,
        cardW: seqRes.cardW,
        cardH: seqRes.cardH,
      };
    } catch (e) {
      console.error("[CardCompositeEngine] Kinetic sequence error, fallback to static:", e);
    }
  }

  const cardTemplate = resolveCardTemplate(presetName);
  const layout = computeCompleteSubtitleLayout({
    text,
    presetName,
    positionAnchor,
    videoW,
    videoH,
  });

  const cardW = layout.cardW;
  const cardH = layout.cardH;
  const overlayX = layout.overlayX;
  const overlayY = layout.overlayY;

  const cardKey = presetName || cardTemplate.name || (cardTemplate.filename ? cardTemplate.filename.replace(".png", "") : "vibrant_yellow_sticker");
  const visionProfiles = loadVisionProfiles();
  const profile = visionProfiles[cardKey] || visionProfiles[cardTemplate.filename?.replace(".png", "")] || {
    inner_box: [200, 200, 800, 800],
    tilt_degrees: 0,
    font_color: "0x111111",
    stroke_color: "0x111111@0.8",
    shadow_color: "0x000000@0.3",
  };

  const compositeFileName = `composite_card_${sceneId}.png`;
  const compositePath = path.join(TEMP_DIR, compositeFileName);

  const inputCardPath = cardTemplate.exists
    ? cardTemplate.path
    : path.join(ROOT, "assets/overlays/cards/vibrant_yellow_sticker.png");

  // Calculate inner safe box dimensions from vision profile
  const [ymin, xmin, ymax, xmax] = profile.inner_box || [200, 200, 800, 800];
  const innerW = Math.round(cardW * ((xmax - xmin) / 1000));
  const innerH = Math.round(cardH * ((ymax - ymin) / 1000));

  const lines = (layout.lines && layout.lines.length) ? layout.lines : [text];
  const fontFile = profile.font_file && fs.existsSync(profile.font_file)
    ? profile.font_file
    : "/System/Library/Fonts/HelveticaNeue.ttc";
  const fontColor = profile.font_color || "0x111111";
  const strokeColor = profile.stroke_color || "0x111111@0.8";
  const shadowColor = profile.shadow_color || "0x000000@0.3";

  // Compute per-line dynamic font size
  const lineFontSizes = lines.map((l) => autoFitFontSize([l], innerW, innerH / lines.length, profile));
  const maxLineFs = Math.max(...lineFontSizes);
  const totalTextH = lineFontSizes.reduce((sum, fsVal) => sum + fsVal * 1.25, 0);

  // Generate per-line drawtext filters
  let currentY = Math.round((cardH - totalTextH) / 2);
  const drawTextFilters = lines.map((l, index) => {
    const lineFs = lineFontSizes[index];
    const textFilePath = path.join(TEMP_DIR, `text_${sceneId}_line_${index}.txt`);
    fs.writeFileSync(textFilePath, l, "utf8");

    const lineDraw = `drawtext=textfile='${textFilePath.replace(/'/g, "'\\''")}':fontfile='${fontFile}':fontcolor=${fontColor}:fontsize=${lineFs}:borderw=3:bordercolor=${strokeColor}:shadowx=0:shadowy=4:shadowcolor=${shadowColor}:text_align=C:x=(w-text_w)/2:y=${currentY}`;
    currentY += Math.round(lineFs * 1.25);
    return lineDraw;
  });

  // Check tilt degrees for rotation
  const tiltDeg = profile.tilt_degrees || 0;
  const tiltRad = ((tiltDeg * Math.PI) / 180).toFixed(4);
  const rotateStr = tiltDeg !== 0 ? `,rotate=${tiltRad}:c=none:ow=rotw(${tiltRad}):oh=roth(${tiltRad})` : "";

  // Build FFmpeg filtergraph with per-line drawtext filters
  const filterGraph = `scale=${cardW}:${cardH},${drawTextFilters.join(",")}${rotateStr}`;

  try {
    const cmd = `ffmpeg -hide_banner -y -i "${inputCardPath}" -vf "${filterGraph}" -vframes 1 "${compositePath}"`;
    execSync(cmd, { stdio: "ignore" });
  } catch (error) {
    try {
      const fallbackCmd = `ffmpeg -hide_banner -y -f lavfi -i "color=c=0x000000@0.0:s=${cardW}x${cardH}:d=1,format=rgba" -vf "drawtext=textfile='${textFilePath.replace(/'/g, "'\\''")}':fontfile='${fontFile}':fontcolor=white:fontsize=${fontSize}:x=(w-text_w)/2:y=(h-text_h)/2" -vframes 1 "${compositePath}"`;
      execSync(fallbackCmd, { stdio: "ignore" });
    } catch (e) {
      console.error("[CardCompositeEngine] Error rendering composite card:", e);
    }
  }

  return {
    compositePath,
    overlayX,
    overlayY,
    cardW,
    cardH,
  };
}

module.exports = {
  generateCompositeCardImage,
};
