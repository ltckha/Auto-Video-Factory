const fs = require("fs");
const path = require("path");

/**
 * Remove Vietnamese accents / diacritics and normalize string
 */
function normalizeText(str) {
  if (!str) return "";
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Common bilingual synonym mappings to bridge Vietnamese video intent with English style profiles
 */
const SYNONYM_MAP = {
  // Shoe / Leather Care
  giay: ["shoe", "shoes", "leather", "loafer", "sneaker", "boot"],
  "danh giay": ["shoeshine", "mirror", "polish", "cream", "wax", "brush"],
  xi: ["shoeshine", "polish", "wax", "cream"],
  da: ["leather", "artisan", "craft", "bespoke", "tooling"],
  "da bo": ["leather", "cowhide", "bespoke"],
  "may chi": ["stitching", "stitch", "sewing", "saddle", "pricking"],
  khau: ["stitching", "stitch", "sewing"],
  "duc lo": ["pricking", "iron", "punch", "hole"],

  // Unboxing / Packaging
  "dap hop": ["unboxing", "box", "package", "peel", "tape", "cardboard", "tactile"],
  "khui": ["unboxing", "open", "reveal", "box", "pull"],
  "mo hop": ["unboxing", "package", "box", "pull"],
  "kien hang": ["package", "box", "shipping", "cardboard"],
  "hop": ["box", "package", "unboxing"],
  "carton": ["cardboard", "box", "package"],
  "rach": ["knife", "cut", "blade", "peel", "tear"],
  "boc": ["peel", "tear", "unboxing", "reveal"],
  dao: ["knife", "blade", "sharp"],
  "bang keo": ["tape", "kraft", "peel", "tear"],

  // Wood / Craft
  go: ["wood", "chisel", "joinery", "shaving", "mortise"],
  duc: ["chisel", "wood", "mortise"],

  // Drink / Cafe
  "ca phe": ["coffee", "latte", "iced", "routine", "cafe"],
  matcha: ["matcha", "boba", "tea", "drink"],

  // Tech / Phone Accessories
  "op lung": ["case", "accessory", "tech", "unboxing", "magsafe", "tactile"],
  op: ["case", "accessory", "cover"],
  "dien thoai": ["phone", "tech", "iphone", "gadget"],
  iphone: ["phone", "tech", "gadget", "case"],
  magsafe: ["magsafe", "tech", "accessory", "case"],
  "boc seal": ["peel", "unboxing", "seal", "tactile", "tear"],
  seal: ["peel", "seal", "unboxing", "tactile"],
  "bien hoa": ["transformation", "speedramp", "flip", "transition"],
  "bien hinh": ["transformation", "outfit", "speedramp", "flip"],

  // Style / Motion
  "dien anh": ["cinematic", "film", "moody", "dark"],
  phonk: ["phonk", "slowed", "sub", "bass", "glide"],
  "sat dat": ["worm", "eye", "low", "angle"],
  "cham rai": ["slow", "glide", "smooth"],
  "muot ma": ["smooth", "glide", "ease"],
  nhanh: ["fast", "dynamic", "speedramp"],
  "pha huy": ["destruction", "press", "crush", "stress"],
};

/**
 * Expands query text with bilingual synonym tokens
 */
function expandQueryTokens(normalizedQuery) {
  const tokens = new Set(normalizedQuery.split(" ").filter((t) => t.length > 1));

  for (const [key, synonyms] of Object.entries(SYNONYM_MAP)) {
    const normKey = normalizeText(key);
    if (normalizedQuery.includes(normKey)) {
      synonyms.forEach((syn) => tokens.add(syn.toLowerCase()));
    }
  }

  return Array.from(tokens);
}

/**
 * Load all learned styles from effects/learned_styles/
 */
function loadLearnedStyles(customDir) {
  const possibleDirs = [
    customDir,
    path.resolve(__dirname, "../../effects/learned_styles"),
    path.resolve(process.cwd(), "effects/learned_styles"),
    path.resolve(__dirname, "../../../effects/learned_styles"),
  ].filter(Boolean);

  let stylesDir = "";
  for (const dir of possibleDirs) {
    if (fs.existsSync(dir)) {
      stylesDir = dir;
      break;
    }
  }

  if (!stylesDir) return [];

  const results = [];
  try {
    const files = fs.readdirSync(stylesDir).filter((f) => f.endsWith(".json"));
    for (const file of files) {
      try {
        const fullPath = path.join(stylesDir, file);
        const rawContent = fs.readFileSync(fullPath, "utf8");
        const json = JSON.parse(rawContent);
        if (json && json.style_profile) {
          const profile = json.style_profile;
          const key = file.replace(/\.json$/, "");
          results.push({
            id: key,
            file,
            profile,
            searchCorpus: normalizeText(
              [
                key,
                profile.name || "",
                profile.category_niche || "",
                profile.description || "",
                profile.hook_strategy || "",
                profile.audio_strategy || "",
                profile.recommended_camera_motion || "",
                profile.motion_graph || "",
              ].join(" ")
            ),
          });
        }
      } catch (err) {
        // Ignore malformed files
      }
    }
  } catch (err) {
    // Ignore read error
  }

  return results;
}

/**
 * Evaluates semantic match between query and learned style profiles
 * Returns best matching style profile or null if below threshold
 *
 * @param {string} queryText Text from ideation (angle name, directive, hook summary, subject)
 * @param {object} [options] Options { threshold: 0.35, customDir }
 * @returns {object|null} Matched style profile with score and metadata
 */
function findBestMatchingStyle(queryText, options = {}) {
  if (!queryText || typeof queryText !== "string") return null;

  const threshold = options.threshold !== undefined ? options.threshold : 0.35;
  const styles = loadLearnedStyles(options.customDir);
  if (!styles || styles.length === 0) return null;

  const normQuery = normalizeText(queryText);
  const queryTokens = expandQueryTokens(normQuery);

  if (queryTokens.length === 0) return null;

  let bestMatch = null;
  let highestScore = 0;

  for (const item of styles) {
    let matchCount = 0;
    let weightedPoints = 0;
    const corpus = item.searchCorpus;

    for (const token of queryTokens) {
      if (corpus.includes(token)) {
        matchCount++;
        // Boost points if matching primary category or name
        const inName = normalizeText(item.profile.name || "").includes(token);
        const inNiche = normalizeText(item.profile.category_niche || "").includes(token);
        weightedPoints += inName ? 3.0 : (inNiche ? 2.0 : 1.0);
      }
    }

    if (matchCount > 0) {
      // Score normalized by token count with diminishing penalty
      const rawScore = weightedPoints / (queryTokens.length * 0.8 + 2);
      const score = Math.min(1.0, Number(rawScore.toFixed(3)));

      if (score > highestScore) {
        highestScore = score;
        bestMatch = {
          id: item.id,
          name: item.profile.name,
          score,
          profile: item.profile,
          reason: `Khớp ${matchCount} từ khóa trọng yếu (Điểm tương đồng: ${(score * 100).toFixed(1)}%)`,
        };
      }
    }
  }

  if (bestMatch && bestMatch.score >= threshold) {
    return bestMatch;
  }

  return null;
}

module.exports = {
  findBestMatchingStyle,
  loadLearnedStyles,
  normalizeText,
  expandQueryTokens,
};
