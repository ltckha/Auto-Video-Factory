/**
 * Kinetic & Impact Text Engine (Priority 4) - CapCut / TikTok 2026 Trend
 * Provides overshoot text pop-in, impact_text, and keyword text_emphasis.
 */

const KEYWORD_HIGHLIGHT_REGEX = /(đế|quai|da bò|da thật|299k|399k|499k|đóng thủ công|bảo hành|siêu êm|chống nước|freeship|ưu đãi|giảm 50%|mua 1 tặng 1)/gi;

/**
 * Enriches subtitle text with kinetic overshoot animation options for drawtext filter.
 * @param {Object} preset - Subtitle preset
 * @param {Object} cue - Cue object
 * @param {string} textBehavior - Behavior name (pop, impact_bup, word_highlight, etc.)
 * @returns {Array} FFmpeg drawtext options string array
 */
function buildKineticTextAnimationOptions(preset, cue, textBehavior = "pop") {
  const cueStart = cue.start.toFixed(3);
  const cueDur = Math.max(0.1, cue.end - cue.start).toFixed(3);

  // 1. Impact Text (Scale 65% -> 125% -> 100% in 0.25s)
  if (textBehavior === "impact_bup" || textBehavior === "pop" || textBehavior === "impact_text") {
    return [
      `fontsize='if(lt(t\\,${(cue.start + 0.15).toFixed(3)})\\,h*0.045+h*0.025*(t-${cueStart})/0.15\\,if(lt(t\\,${(cue.start + 0.25).toFixed(3)})\\,h*0.070-h*0.015*(t-${(cue.start + 0.15).toFixed(3)})/0.10\\,h*0.055))'`,
      `alpha='if(lt(t\\,${(cue.start + 0.12).toFixed(3)})\\,0.2+0.8*(t-${cueStart})/0.12\\,1)'`,
    ];
  }

  // 2. Typewriter Fast
  if (textBehavior === "typewriter") {
    return [
      `alpha='if(lt(t\\,${(cue.start + 0.2).toFixed(3)})\\,0.3+0.7*(t-${cueStart})/0.2\\,1)'`,
    ];
  }

  // Default soft pop
  return [
    `alpha='if(lt(t\\,${(cue.start + 0.18).toFixed(3)})\\,0.5+0.5*(t-${cueStart})/0.18\\,1)'`,
  ];
}

/**
 * Extracts and tags keywords for text_emphasis
 * @param {string} text 
 * @returns {Object} { cleanText, highlightedKeyword }
 */
function extractTextEmphasis(text) {
  if (!text) return { cleanText: "", highlightedKeyword: null };

  const match = text.match(KEYWORD_HIGHLIGHT_REGEX);
  return {
    cleanText: text,
    highlightedKeyword: match ? match[0] : null,
  };
}

module.exports = {
  buildKineticTextAnimationOptions,
  extractTextEmphasis,
};
