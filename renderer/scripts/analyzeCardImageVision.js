/**
 * Gemini Vision Card Frame Analyzer for Auto-Video-Factory
 * Uses Gemini Multimodal Vision API to inspect frame PNG images and extract
 * exact inner bounding boxes [ymin, xmin, ymax, xmax], tilt angles, and color palettes.
 * Results are cached in renderer/config/cardVisionProfiles.json.
 */

const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");

const ROOT = path.resolve(__dirname, "..");
const CARDS_DIR = path.join(ROOT, "assets/overlays/cards");
const CONFIG_DIR = path.join(ROOT, "config");
const PROFILES_PATH = path.join(CONFIG_DIR, "cardVisionProfiles.json");

// Ensure config dir exists
if (!fs.existsSync(CONFIG_DIR)) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
}

function loadProfilesCache() {
  if (fs.existsSync(PROFILES_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(PROFILES_PATH, "utf8"));
    } catch (e) {
      return {};
    }
  }
  return {};
}

function saveProfilesCache(profiles) {
  fs.writeFileSync(PROFILES_PATH, JSON.stringify(profiles, null, 2), "utf8");
}

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY / GOOGLE_API_KEY environment variable is not set.");
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Analyze a single card frame PNG image using Gemini Vision API
 * @param {string} imagePath
 * @returns {Promise<Object>}
 */
async function analyzeCardWithGeminiVision(imagePath) {
  const ai = getGeminiClient();
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString("base64");

  const prompt = `Analyze this graphic frame badge overlay PNG image for video subtitles according to Google Gemini Multimodal Image Understanding guidelines.

Identify:
1. "inner_box": The exact inner clear safe container box for placing text [ymin, xmin, ymax, xmax] in normalized 0-1000 integer coordinates.
2. "tilt_degrees": The tilt angle / rotation angle of the frame badge in degrees (e.g. -3.5, 0, 5.0).
3. "font_color": Recommended high-contrast text hex color (e.g. "0x111111" for yellow cards, "0xFFFFFF" for dark/red cards).
4. "stroke_color": Recommended text outline border color hex.
5. "shadow_color": Recommended drop shadow color hex with opacity.
6. "max_lines": Maximum recommended text lines (2 or 3).

Return ONLY valid JSON matching this schema:
{
  "inner_box": [ymin, xmin, ymax, xmax],
  "tilt_degrees": number,
  "font_color": "hex",
  "stroke_color": "hex",
  "shadow_color": "hex",
  "max_lines": number
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType: "image/png", data: base64Image } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
    },
  });

  const textOutput = response.text;
  return JSON.parse(textOutput);
}

/**
 * Get or compute vision profile for a card template key
 * @param {string} cardKey
 * @returns {Promise<Object>}
 */
async function getOrComputeCardVisionProfile(cardKey) {
  const profiles = loadProfilesCache();
  const cardPath = path.join(CARDS_DIR, `${cardKey}.png`);

  if (!fs.existsSync(cardPath)) {
    // Return default fallback profile if file doesn't exist yet
    return {
      inner_box: [200, 200, 800, 800],
      tilt_degrees: 0,
      font_color: "0x111111",
      stroke_color: "0x000000@0.8",
      shadow_color: "0x000000@0.3",
      max_lines: 3,
    };
  }

  const stat = fs.statSync(cardPath);
  const mtime = stat.mtimeMs;

  // Return cached profile if valid and not modified
  if (profiles[cardKey] && profiles[cardKey]._mtime === mtime) {
    return profiles[cardKey];
  }

  console.log(`[GeminiVision] 🔍 Analyzing new/modified frame card image: ${cardKey}.png ...`);
  try {
    const visionData = await analyzeCardWithGeminiVision(cardPath);
    const profile = {
      ...visionData,
      _mtime: mtime,
      _updatedAt: new Date().toISOString(),
    };
    profiles[cardKey] = profile;
    saveProfilesCache(profiles);
    console.log(`[GeminiVision] ✅ Successfully cached vision profile for ${cardKey}.png!`);
    return profile;
  } catch (error) {
    console.error(`[GeminiVision] WARN: Vision analysis failed for ${cardKey}, using fallback. Error:`, error.message);
    return {
      inner_box: [200, 200, 800, 800],
      tilt_degrees: 0,
      font_color: "0x111111",
      stroke_color: "0x000000@0.8",
      shadow_color: "0x000000@0.3",
      max_lines: 3,
      _mtime: mtime,
    };
  }
}

/**
 * Batch analyze all card PNGs in renderer/assets/overlays/cards/
 */
async function syncAllCardVisionProfiles() {
  if (!fs.existsSync(CARDS_DIR)) return;
  const files = fs.readdirSync(CARDS_DIR).filter((f) => f.endsWith(".png"));
  for (const file of files) {
    const cardKey = path.basename(file, ".png");
    await getOrComputeCardVisionProfile(cardKey);
  }
}

module.exports = {
  getOrComputeCardVisionProfile,
  syncAllCardVisionProfiles,
};

if (require.main === module) {
  syncAllCardVisionProfiles().then(() => console.log("Vision profile sync completed."));
}
