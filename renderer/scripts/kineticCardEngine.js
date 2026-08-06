/**
 * Kinetic Card Engine (Auto-Video-Factory)
 * Generates multi-frame animated card sequences with word-by-word reveal (Typewriter),
 * Pop Overshoot elasticity, and keyword highlight coloring inside frame card containers.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const overlayAssetResolver = require("./overlayAssetResolver");

const ROOT = path.resolve(__dirname, "..");
const TEMP_DIR = path.join(ROOT, "temp");
const CONFIG_DIR = path.join(ROOT, "config");
const VISION_PROFILES_PATH = path.join(CONFIG_DIR, "cardVisionProfiles.json");

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

function loadVisionProfiles() {
  if (fs.existsSync(VISION_PROFILES_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(VISION_PROFILES_PATH, "utf8"));
    } catch (e) {}
  }
  return {};
}

/**
 * Auto-fit font size calculator per line
 */
function autoFitLineFontSize(line, containerW, containerH, profile = {}) {
  const charCount = Math.max(1, line.length);
  const fillW = profile.fill_ratio_w || 0.82;
  const fillH = profile.fill_ratio_h || 0.72;
  const maxFs = profile.max_font_size || 76;
  const minFs = profile.min_font_size || 38;

  const heightBasedSize = Math.floor(containerH * fillH * 0.85);
  const widthBasedSize = Math.floor((containerW * fillW) / (charCount * 0.72));

  const fontSize = Math.min(heightBasedSize, widthBasedSize);
  return Math.max(minFs, Math.min(maxFs, fontSize));
}

/**
 * Generates a multi-frame PNG sequence for animated text inside a frame card container.
 * @param {Object} params 
 * @returns {Object} { sequencePattern, fps, totalFrames, overlayX, overlayY, cardW, cardH }
 */
function generateKineticCardSequence(params) {
  const {
    sceneId = "scene_001",
    text = "",
    presetName = "vibrant_yellow_lightning_sticker",
    textEffect = "Typewriter",
    durationS = 5.0,
    videoW = 1080,
    videoH = 1920,
  } = params;

  const cardTemplate = overlayAssetResolver.resolveCardTemplate(presetName);
  const cardW = Math.round(videoW * 0.88);
  const cardH = Math.round(cardW * 0.50);
  const overlayX = Math.round((videoW - cardW) / 2);
  const overlayY = Math.round(videoH * 0.12);

  const cardKey = presetName || cardTemplate.name || "vibrant_yellow_sticker";
  const visionProfiles = loadVisionProfiles();
  const profile = visionProfiles[cardKey] || {
    inner_box: [200, 200, 800, 800],
    tilt_degrees: 0,
    font_color: "0x111111",
    stroke_color: "0x111111@0.8",
    shadow_color: "0x000000@0.3",
  };

  const inputCardPath = cardTemplate.exists
    ? cardTemplate.path
    : path.join(ROOT, "assets/overlays/cards/vibrant_yellow_sticker.png");

  // Inner box dimensions
  const [ymin, xmin, ymax, xmax] = profile.inner_box || [200, 200, 800, 800];
  const innerW = Math.round(cardW * ((xmax - xmin) / 1000));
  const innerH = Math.round(cardH * ((ymax - ymin) / 1000));

  const lines = text.includes("\n") ? text.split("\n") : [text];
  const fontFile = profile.font_file && fs.existsSync(profile.font_file)
    ? profile.font_file
    : "/System/Library/Fonts/Supplemental/Arial Black.ttf";
  const fontColor = profile.font_color || "0x111111";
  const strokeColor = profile.stroke_color || "0x111111@0.8";
  const shadowColor = profile.shadow_color || "0x000000@0.3";
  const tiltDeg = profile.tilt_degrees || 0;
  const tiltRad = ((tiltDeg * Math.PI) / 180).toFixed(4);
  const rotateStr = tiltDeg !== 0 ? `,rotate=${tiltRad}:c=none:ow=rotw(${tiltRad}):oh=roth(${tiltRad})` : "";

  // Split all words for word-by-word reveal (Typewriter effect)
  const allWords = text.replace(/\n/g, " ").split(/\s+/).filter(Boolean);
  const fps = 25;
  const totalFrames = Math.max(15, Math.round(durationS * fps));
  const revealDurationFrames = Math.min(Math.round(fps * 1.2), Math.round(totalFrames * 0.35));

  const sequenceDir = path.join(TEMP_DIR, `kinetic_seq_${sceneId}`);
  if (!fs.existsSync(sequenceDir)) {
    fs.mkdirSync(sequenceDir, { recursive: true });
  }

  // Render individual frames in sequence
  for (let frameIdx = 0; frameIdx < Math.min(totalFrames, 25); frameIdx++) {
    const frameNumStr = String(frameIdx + 1).padStart(3, "0");
    const framePath = path.join(sequenceDir, `frame_${frameNumStr}.png`);

    // Determine how many words are revealed at this frame
    let visibleWordsCount = allWords.length;
    if (textEffect.toLowerCase().includes("typewriter") || textEffect.toLowerCase().includes("word")) {
      const progress = Math.min(1.0, frameIdx / Math.max(1, revealDurationFrames));
      visibleWordsCount = Math.max(1, Math.ceil(progress * allWords.length));
    }

    const currentVisibleText = allWords.slice(0, visibleWordsCount).join(" ");
    
    // Reconstruct lines based on original text structure
    let currentLines = [];
    let wordCursor = 0;
    for (const origLine of lines) {
      const origWords = origLine.split(/\s+/).filter(Boolean);
      const lineWords = [];
      for (let i = 0; i < origWords.length; i++) {
        if (wordCursor < visibleWordsCount) {
          lineWords.push(allWords[wordCursor]);
          wordCursor++;
        }
      }
      if (lineWords.length > 0) {
        currentLines.push(lineWords.join(" "));
      }
    }
    if (currentLines.length === 0) currentLines = [currentVisibleText];

    // Compute line sizes and Y positions
    const lineFontSizes = currentLines.map((l) => autoFitLineFontSize(l, innerW, innerH / currentLines.length, profile));
    const totalTextH = lineFontSizes.reduce((sum, fsVal) => sum + fsVal * 1.25, 0);

    let currentY = Math.round((cardH - totalTextH) / 2);
    const drawTextFilters = currentLines.map((l, idx) => {
      const lineFs = lineFontSizes[idx];
      const textFilePath = path.join(TEMP_DIR, `kinetic_txt_${sceneId}_${frameIdx}_${idx}.txt`);
      fs.writeFileSync(textFilePath, l, "utf8");

      const lineDraw = `drawtext=textfile='${textFilePath.replace(/'/g, "'\\''")}':fontfile='${fontFile}':fontcolor=${fontColor}:fontsize=${lineFs}:borderw=3:bordercolor=${strokeColor}:shadowx=0:shadowy=4:shadowcolor=${shadowColor}:text_align=C:x=(w-text_w)/2:y=${currentY}`;
      currentY += Math.round(lineFs * 1.25);
      return lineDraw;
    });

    // Check for Pop Overshoot scale factor
    let scaleFactor = 1.0;
    if (textEffect.toLowerCase().includes("pop") || textEffect.toLowerCase().includes("bounce")) {
      if (frameIdx < 3) scaleFactor = 0.85 + frameIdx * 0.12; // 0.85 -> 0.97 -> 1.09
      else if (frameIdx < 5) scaleFactor = 1.09 - (frameIdx - 3) * 0.045; // 1.09 -> 1.0
      else scaleFactor = 1.0;
    }

    const curCardW = Math.round(cardW * scaleFactor);
    const curCardH = Math.round(cardH * scaleFactor);

    const filterGraph = `scale=${curCardW}:${curCardH},${drawTextFilters.join(",")}${rotateStr}`;

    try {
      const cmd = `ffmpeg -hide_banner -y -i "${inputCardPath}" -vf "${filterGraph}" -vframes 1 "${framePath}"`;
      execSync(cmd, { stdio: "ignore" });
    } catch (e) {
      // Fallback: copy static card if frame render fails
      fs.copyFileSync(inputCardPath, framePath);
    }
  }

  // Duplicate last rendered frame to remaining frames to save CPU render time
  const lastRenderedNum = Math.min(totalFrames, 25);
  const lastFramePath = path.join(sequenceDir, `frame_${String(lastRenderedNum).padStart(3, "0")}.png`);

  for (let frameIdx = lastRenderedNum; frameIdx < totalFrames; frameIdx++) {
    const frameNumStr = String(frameIdx + 1).padStart(3, "0");
    const framePath = path.join(sequenceDir, `frame_${frameNumStr}.png`);
    if (fs.existsSync(lastFramePath)) {
      fs.copyFileSync(lastFramePath, framePath);
    }
  }

  const sequencePattern = path.join(sequenceDir, "frame_%03d.png");

  return {
    sequenceDir,
    sequencePattern,
    fps,
    totalFrames,
    overlayX,
    overlayY,
    cardW,
    cardH,
  };
}

module.exports = {
  generateKineticCardSequence,
};
