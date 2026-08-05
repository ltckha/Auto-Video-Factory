/**
 * Subtitle Layout Engine Module for Auto-Video-Factory (IDEA-007)
 * Implements 2-Stage Dynamic Layout Math:
 *   Stage A: Text-into-Frame Fitting (Font Scaling, Auto-Wrapping to fit Inner Bounds)
 *   Stage B: Frame-into-Video Positioning (TikTok Safe Zone Guard, Position Anchoring)
 */

const { resolveCardTemplate } = require("./overlayAssetResolver");

// TikTok / Vertical Video Safe Zone Limits (9:16 aspect ratio 1080x1920)
const SAFE_ZONE = {
  TOP_MIN_Y: 0.10,      // Avoid top notch / status bar
  BOTTOM_MAX_Y: 0.78,   // Avoid bottom caption overlay & music bar
  RIGHT_MAX_X: 0.85,    // Avoid right action buttons (Like, Share, Comment)
  LEFT_MIN_X: 0.05,
};

/**
 * Stage A: Calculate dynamic font size and text wrapping to fit inner frame bounds
 * @param {string} text 
 * @param {Object} innerBounds { x, y, w, h } percentage ratios relative to card
 * @param {number} cardWidth Card width in pixels
 * @param {number} cardHeight Card height in pixels
 * @returns {{ lines: string[], fontSize: number, innerPaddingX: number, innerPaddingY: number }}
 */
function computeStageATextFitting(text, innerBounds, cardWidth, cardHeight) {
  const innerW = cardWidth * innerBounds.w;
  const innerH = cardHeight * innerBounds.h;
  const innerX = cardWidth * innerBounds.x;
  const innerY = cardHeight * innerBounds.y;

  const rawText = (text || "").trim();
  const rawWords = rawText.split(/\s+/);
  const totalChars = rawText.length;

  // Estimate lines needed: Respect Gemini AI explicit \n line breaks first!
  let lines = [];
  if (rawText.includes("\n")) {
    lines = rawText.split("\n").map(l => l.trim()).filter(Boolean);
  } else if (totalChars <= 18) {
    lines = [rawText];
  } else if (totalChars <= 40) {
    // Split into 2 balanced lines
    const midIndex = Math.ceil(rawWords.length / 2);
    lines = [
      rawWords.slice(0, midIndex).join(" "),
      rawWords.slice(midIndex).join(" "),
    ];
  } else {
    // Split into 3 balanced lines
    const chunkSize = Math.ceil(rawWords.length / 3);
    lines = [
      rawWords.slice(0, chunkSize).join(" "),
      rawWords.slice(chunkSize, chunkSize * 2).join(" "),
      rawWords.slice(chunkSize * 2).join(" "),
    ];
  }

  // Calculate dynamic font size based on max line length and height
  const maxLineLen = Math.max(...lines.map(l => l.length));
  let fontSize = Math.floor((innerW * 0.85) / Math.max(maxLineLen * 0.55, 6));

  // Clamp font size
  fontSize = Math.max(48, Math.min(88, fontSize));

  // Ensure total line height fits innerH
  const lineHeight = fontSize * 1.25;
  const totalTextH = lines.length * lineHeight;
  if (totalTextH > innerH * 0.90) {
    fontSize = Math.floor(fontSize * (innerH * 0.90 / totalTextH));
    fontSize = Math.max(42, fontSize);
  }

  return {
    lines,
    fontSize,
    innerPaddingX: Math.round(innerX),
    innerPaddingY: Math.round(innerY),
    innerW: Math.round(innerW),
    innerH: Math.round(innerH),
  };
}

/**
 * Stage B: Calculate card position on video ensuring TikTok Safe Zone compliance
 * @param {string} positionAnchor 'top' | 'center' | 'bottom_safe'
 * @param {number} videoW Video width (e.g. 1080)
 * @param {number} videoH Video height (e.g. 1920)
 * @param {number} cardW Card overlay width
 * @param {number} cardH Card overlay height
 * @returns {{ overlayX: number, overlayY: number }}
 */
function computeStageBFramePosition(positionAnchor, videoW, videoH, cardW, cardH) {
  // Center horizontally
  let overlayX = Math.round((videoW - cardW) / 2);

  // Vertical position anchoring
  let overlayY = Math.round(videoH * 0.12); // Default 'top'

  if (positionAnchor === "center") {
    overlayY = Math.round((videoH - cardH) / 2);
  } else if (positionAnchor === "bottom" || positionAnchor === "bottom_safe") {
    overlayY = Math.round(videoH * 0.68); // Safe from bottom TikTok caption & comment input
  } else if (positionAnchor === "top") {
    overlayY = Math.round(videoH * 0.12);
  }

  // Clamp Y Y-axis to respect Safe Zone
  const minY = Math.round(videoH * SAFE_ZONE.TOP_MIN_Y);
  const maxY = Math.round(videoH * SAFE_ZONE.BOTTOM_MAX_Y - cardH);
  overlayY = Math.max(minY, Math.min(maxY, overlayY));

  return {
    overlayX,
    overlayY,
  };
}

/**
 * Compute Complete 2-Stage Subtitle Layout for FFmpeg render graph
 * @param {Object} params
 * @param {string} params.text
 * @param {string} params.presetName
 * @param {string} params.positionAnchor
 * @param {number} params.videoW
 * @param {number} params.videoH
 */
function computeCompleteSubtitleLayout(params) {
  const {
    text = "",
    presetName = "vibrant_sticker_label",
    positionAnchor = "top",
    videoW = 1080,
    videoH = 1920,
  } = params;

  const cardTemplate = resolveCardTemplate(presetName);

  // Card target dimensions (scale to ~85% of video width)
  const cardW = Math.round(videoW * 0.88);
  const cardH = Math.round(cardW * (480 / 960)); // Standard card aspect ratio

  // Stage A: Fit Text into Frame
  const stageA = computeStageATextFitting(text, cardTemplate.bounds, cardW, cardH);

  // Stage B: Position Frame on Video
  const stageB = computeStageBFramePosition(positionAnchor, videoW, videoH, cardW, cardH);

  return {
    cardTemplate,
    cardW,
    cardH,
    ...stageA,
    ...stageB,
  };
}

/**
 * Backward compatibility helper for prepareSubtitleLayout
 */
function prepareSubtitleLayout(text, options = {}) {
  const result = computeStageATextFitting(
    text,
    { x: 0.1, y: 0.15, w: 0.8, h: 0.7 },
    options.target ? options.target.w || 1080 : 1080,
    options.target ? options.target.h || 1920 : 1920
  );
  return {
    lines: result.lines,
    fontSize: result.fontSize,
    maxChars: Math.max(...result.lines.map((l) => l.length)),
  };
}

/**
 * Backward compatibility helper for wrapSubtitleText
 */
function wrapSubtitleText(text, maxChars = 20, maxLines = 2) {
  const result = computeStageATextFitting(
    text,
    { x: 0.1, y: 0.15, w: 0.8, h: 0.7 },
    1080,
    1920
  );
  return result.lines;
}

module.exports = {
  computeStageATextFitting,
  computeStageBFramePosition,
  computeCompleteSubtitleLayout,
  prepareSubtitleLayout,
  wrapSubtitleText,
  SAFE_ZONE,
};
