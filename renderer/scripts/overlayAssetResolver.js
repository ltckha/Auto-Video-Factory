/**
 * Overlay Asset Resolver Module for Auto-Video-Factory (IDEA-007)
 * Manages graphic card overlay templates and dynamic sticker assets.
 */

const path = require("path");
const fs = require("fs");

const ASSETS_DIR = path.join(__dirname, "../assets/overlays");
const CARDS_DIR = path.join(ASSETS_DIR, "cards");
const STICKERS_DIR = path.join(ASSETS_DIR, "stickers");

// Map preset names to graphic card template filenames
const CARD_TEMPLATE_MAP = {
  vibrant_sticker_label: "vibrant_yellow_sticker.png",
  vibrant_yellow_lightning: "vibrant_yellow_lightning_sticker.png",
  minimal_glass_card: "minimal_glass_card.png",
  warning_red_badge: "warning_red_badge.png",
  neon_cyber_badge: "warning_red_badge.png",
  hook_bold: "vibrant_yellow_sticker.png",
  framed_card: "minimal_glass_card.png",
  gold_caption: "vibrant_yellow_lightning_sticker.png",
  cta_red: "warning_red_badge.png",
};

// Inner safe bounding box ratios for each graphic card template
// x, y, w, h are percentage ratios relative to card template dimensions
const CARD_INNER_BOUNDS = {
  vibrant_sticker_label: { x: 0.20, y: 0.20, w: 0.60, h: 0.60 },
  vibrant_yellow_sticker: { x: 0.20, y: 0.20, w: 0.60, h: 0.60 },
  vibrant_yellow_lightning: { x: 0.18, y: 0.22, w: 0.64, h: 0.56 },
  minimal_glass_card: { x: 0.12, y: 0.15, w: 0.76, h: 0.70 },
  warning_red_badge: { x: 0.22, y: 0.22, w: 0.56, h: 0.56 },
  neon_cyber_card: { x: 0.18, y: 0.20, w: 0.64, h: 0.60 },
  hook_bold: { x: 0.20, y: 0.20, w: 0.60, h: 0.60 },
  framed_card: { x: 0.12, y: 0.15, w: 0.76, h: 0.70 },
  gold_caption: { x: 0.18, y: 0.22, w: 0.64, h: 0.56 },
  cta_red: { x: 0.22, y: 0.22, w: 0.56, h: 0.56 },
};

/**
 * Resolve graphic card template file path and inner bounds
 * @param {string} presetName 
 * @returns {{ path: string, exists: boolean, bounds: {x: number, y: number, w: number, h: number} }}
 */
function resolveCardTemplate(presetName) {
  const filename = CARD_TEMPLATE_MAP[presetName] || "vibrant_yellow_sticker.png";
  const filePath = path.join(CARDS_DIR, filename);
  const exists = fs.existsSync(filePath);
  const bounds = CARD_INNER_BOUNDS[presetName] || { x: 0.10, y: 0.15, w: 0.80, h: 0.70 };

  return {
    path: filePath,
    exists,
    bounds,
  };
}

/**
 * Resolve sticker asset file path
 * @param {string} stickerName 
 * @returns {{ path: string, exists: boolean }}
 */
function resolveStickerAsset(stickerName) {
  const cleanName = (stickerName || "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  const possibleNames = [`${cleanName}.png`, `${cleanName}.gif`, "lightning_bolt.png"];
  
  for (const filename of possibleNames) {
    const filePath = path.join(STICKERS_DIR, filename);
    if (fs.existsSync(filePath)) {
      return { path: filePath, exists: true };
    }
  }

  return { path: path.join(STICKERS_DIR, "lightning_bolt.png"), exists: false };
}

module.exports = {
  resolveCardTemplate,
  resolveStickerAsset,
  CARD_TEMPLATE_MAP,
  CARD_INNER_BOUNDS,
};
