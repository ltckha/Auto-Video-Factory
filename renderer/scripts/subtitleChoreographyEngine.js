/**
 * Architectural Layer 2: Subtitle Choreography Engine (subtitleChoreographyEngine.js)
 * Implements 3-Level Subtitle Choreography (Level 1 Base / Level 2 Emphasis / Level 3 Impact)
 * Handles Phrase-First Chunking, Emphasis Items, 6 Subtitle Personalities, and Say On Beat.
 */

const SUBTITLE_PERSONALITIES = {
  CLEAN_KINETIC: {
    key: "CLEAN_KINETIC",
    name: "Clean Kinetic (Mặc định Thanh Lịch)",
    fontColor: "0xFFFFFF",
    boxColor: "0x000000@0.20",
    borderWidth: 1,
    animation: "soft_pop",
  },

  SOCIAL_PUNCH: {
    key: "SOCIAL_PUNCH",
    name: "Social Punch (TikTok Bán Hàng Nổi Bật)",
    fontColor: "0xFFFFFF",
    borderColor: "0x000000",
    borderWidth: 4,
    animation: "hook_lift",
  },

  UGC_TALK: {
    key: "UGC_TALK",
    name: "UGC Talk (Review Chân Thực Nhún Nhẹ)",
    fontColor: "0xFFFDF6",
    shadowColor: "0x000000@0.40",
    animation: "soft_pop",
  },

  EDITORIAL_LUXURY: {
    key: "EDITORIAL_LUXURY",
    name: "Editorial Luxury (Đồ Da Sang Trọng Nét Mỏng)",
    fontColor: "0xFFF7DE",
    animation: "luminous_fade",
  },

  IMPACT_SALE: {
    key: "IMPACT_SALE",
    name: "Impact Sale (Báo Giá 299K Cực Đại)",
    fontColor: "0xFF2A2A",
    boxColor: "0x111111@0.88",
    animation: "cta_focus",
  },

  MEME_PLAYFUL: {
    key: "MEME_PLAYFUL",
    name: "Meme Playful (Nảy Tưng Hài Hước)",
    fontColor: "0xFFFF00",
    animation: "soft_pop",
  },
};

const COMMERCIAL_REGEX = /(299k|399k|499k|giảm 50%|mua 1 tặng 1|sale|freeship|đừng mua|lực|đỉnh|siêu rực rỡ)/gi;
const BENEFIT_REGEX = /(đế|quai|da bò|da thật|siêu êm|chống nước|bảo hành|thủ công|lung linh|rực rỡ|tập nập)/gi;

/**
 * Categorizes a subtitle phrase or emphasis item into Choreography Level 1, 2, or 3.
 * @param {Object|string} item - Emphasis item, phrase object, or raw text string
 * @param {string} personalityKey - Personality key
 * @returns {Object} Choreographed text options
 */
function choreographSubtitleItem(item, personalityKey = "CLEAN_KINETIC") {
  let text = "";
  let type = "";
  let score = 0.5;

  if (typeof item === "string") {
    text = item;
    if (COMMERCIAL_REGEX.test(text)) {
      type = "commercial";
      score = 0.95;
    } else if (BENEFIT_REGEX.test(text)) {
      type = "benefit";
      score = 0.75;
    }
  } else if (item && typeof item === "object") {
    text = item.text || "";
    type = String(item.type || "").toLowerCase();
    score = Number(item.score) || 0.5;

    if (!type) {
      if (COMMERCIAL_REGEX.test(text)) type = "commercial";
      else if (BENEFIT_REGEX.test(text)) type = "benefit";
    }
  }

  // Level 3 — Impact (5-10%): 299K, ĐỪNG MUA, GIẢM 50%
  if (type === "commercial" || type === "warning" || score >= 0.90) {
    return {
      text,
      level: "level3",
      behavior: "impact_bup",
      scale: 1.25,
      styleKey: "cta_red",
      personality: SUBTITLE_PERSONALITIES.IMPACT_SALE,
    };
  }

  // Level 2 — Emphasis (15-25%): êm, nhẹ, da bò, bảo hành
  if (type === "benefit" || type === "proof" || score >= 0.70) {
    return {
      text,
      level: "level2",
      behavior: "word_highlight",
      scale: 1.15,
      styleKey: "gold_caption",
      personality: SUBTITLE_PERSONALITIES[personalityKey] || SUBTITLE_PERSONALITIES.CLEAN_KINETIC,
    };
  }

  // Level 1 — Base Caption (70-80%): Lời nói bình thường phông nền
  return {
    text,
    level: "level1",
    behavior: "normal",
    scale: 1.0,
    styleKey: "framed_card",
    personality: SUBTITLE_PERSONALITIES[personalityKey] || SUBTITLE_PERSONALITIES.CLEAN_KINETIC,
  };
}

/**
 * Splits a full sentence into sequential phrase cues so subtitles enter dynamically word-by-word/phrase-by-phrase!
 * @param {string} text - Full sentence text
 * @param {number} duration - Scene duration in seconds
 * @returns {Array} Array of timed phrase cues
 */
function splitSubtitleIntoSequentialCues(text, duration) {
  if (!text || typeof text !== "string") return [];
  const words = text.trim().split(/\s+/);
  if (words.length <= 2) {
    return [{ text: text.trim(), start: 0, end: duration }];
  }

  // Chunk words into phrases of 2-3 words
  const phrases = [];
  let current = [];
  for (let i = 0; i < words.length; i++) {
    current.push(words[i]);
    if (current.length >= 2 || i === words.length - 1) {
      phrases.push(current.join(" "));
      current = [];
    }
  }

  const step = duration / phrases.length;
  return phrases.map((phraseText, idx) => ({
    text: phraseText,
    start: Number((idx * step).toFixed(2)),
    end: Number(((idx + 1) * step).toFixed(2)),
  }));
}

module.exports = {
  SUBTITLE_PERSONALITIES,
  choreographSubtitleItem,
  splitSubtitleIntoSequentialCues,
};
