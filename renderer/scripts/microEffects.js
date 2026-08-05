/**
 * Core Registry for 2026 Micro-Effects & Kinetic Text Animations (0.10s - 0.35s)
 * Designed for FFmpeg filtergraph execution with zero impact on rendering speed.
 */

const MICRO_EFFECTS = {
  // --- MOTION & ZOOM ---
  punch_zoom: {
    name: "punch_zoom",
    category: "motion",
    duration_s: 0.15,
    description: "Cú giật phóng to 108% siêu nhanh trong 0.15s rồi trả về góc quay chuẩn",
    getFilter: (startSec, durSec) => {
      const d = 0.15;
      const endSec = startSec + d;
      return `zoompan=z='if(between(time,${startSec},${endSec}),1.08,1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920`;
    },
  },

  micro_zoom: {
    name: "micro_zoom",
    category: "motion",
    duration_s: 0.2,
    description: "Cú phóng nhẹ 105% trong 0.2s giúp phân cảnh có điểm nhấn nhẹ nhàng",
    getFilter: (startSec, durSec) => {
      const endSec = startSec + 0.2;
      return `zoompan=z='if(between(time,${startSec},${endSec}),1.05,1)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1080x1920`;
    },
  },

  slow_push: {
    name: "slow_push",
    category: "motion",
    duration_s: 3.0,
    description: "Đẩy góc quay tiến vào từ từ 100% đến 105%",
    getFilter: (startSec, durSec) => {
      return `zoompan=z='min(1.05,1.0+(0.05*on/${Math.max(1, durSec * 25)}))':d=1:s=1080x1920`;
    },
  },

  speed_ramp: {
    name: "speed_ramp",
    category: "motion",
    duration_s: 0.5,
    description: "Tua nhanh 2x trong 0.5s rồi trở lại tốc độ thường (Velocity Effect)",
    speedRatio: 2.0,
  },

  freeze_frame: {
    name: "freeze_frame",
    category: "motion",
    duration_s: 0.3,
    description: "Đứng hình 0.3s tại điểm hành động quan trọng",
    getFilter: (startSec, durSec) => {
      return `freezedetect=n=-60dB:d=0.3`;
    },
  },

  // --- IMPACT & FLASH ---
  micro_shake: {
    name: "micro_shake",
    category: "impact",
    duration_s: 0.2,
    description: "Rung lắc vi mô 0.2s tạo lực kịch tính",
    getFilter: (startSec, durSec) => {
      const endSec = startSec + 0.2;
      return `crop=w='iw-12':h='ih-12':x='(iw-12)/2+if(between(time,${startSec},${endSec}),sin(time*100)*6,0)':y='(ih-12)/2+if(between(time,${startSec},${endSec}),cos(time*100)*6,0)'`;
    },
  },

  impact_shake: {
    name: "impact_shake",
    category: "impact",
    duration_s: 0.3,
    description: "Rung nổ lực mạnh 0.3s",
    getFilter: (startSec, durSec) => {
      const endSec = startSec + 0.3;
      return `crop=w='iw-20':h='ih-20':x='(iw-20)/2+if(between(time,${startSec},${endSec}),sin(time*120)*10,0)':y='(ih-20)/2+if(between(time,${startSec},${endSec}),cos(time*120)*10,0)'`;
    },
  },

  flash_white: {
    name: "flash_white",
    category: "impact",
    duration_s: 0.15,
    description: "Chớp sáng trắng 0.15s ngay điểm chuyển ý",
    getFilter: (startSec, durSec) => {
      const endSec = startSec + 0.15;
      return `eq=brightness='if(between(time,${startSec},${endSec}),0.35,0)':contrast='if(between(time,${startSec},${endSec}),1.4,1)'`;
    },
  },

  blink_black: {
    name: "blink_black",
    category: "impact",
    duration_s: 0.15,
    description: "Chớp tối đen 0.15s tạo nhịp ngắt",
    getFilter: (startSec, durSec) => {
      const endSec = startSec + 0.15;
      return `eq=brightness='if(between(time,${startSec},${endSec}),-0.4,0)'`;
    },
  },

  motion_blur: {
    name: "motion_blur",
    category: "impact",
    duration_s: 0.25,
    description: "Tạo hiệu ứng vệt mờ chuyển động mượt mà",
    getFilter: (startSec, durSec) => {
      return `tblend=all_mode=average`;
    },
  },

  // --- TRANSITIONS ---
  whip_swipe: {
    name: "whip_swipe",
    category: "transition",
    duration_s: 0.2,
    description: "Gạt khung hình nhanh thần tốc sang trái",
    ffmpegTransition: "whip_left",
  },

  zoom_transition: {
    name: "zoom_transition",
    category: "transition",
    duration_s: 0.25,
    description: "Phóng to xuyên qua khung hình",
    ffmpegTransition: "zoom_in",
  },

  flash_transition: {
    name: "flash_transition",
    category: "transition",
    duration_s: 0.15,
    description: "Chuyển cảnh bằng cú chớp sáng",
    ffmpegTransition: "flash_white",
  },

  blur_transition: {
    name: "blur_transition",
    category: "transition",
    duration_s: 0.25,
    description: "Mờ mượt trước khi sang cảnh mới",
    ffmpegTransition: "dissolve",
  },

  glitch_impact: {
    name: "glitch_impact",
    category: "transition",
    duration_s: 0.2,
    description: "Hiệu ứng nhiễu sóng nhẹ đúng 0.2s",
    ffmpegTransition: "glitch",
  },

  // --- TEXT ANIMATIONS & BEHAVIORS ---
  pop_overshoot: {
    name: "pop_overshoot",
    category: "text",
    duration_s: 0.25,
    description: "Chữ nổ phóng to 115% rồi thu về 100% trong 0.25s (Overshoot POP)",
    textBehavior: "pop",
  },

  word_highlight: {
    name: "word_highlight",
    category: "text",
    duration_s: 0.3,
    description: "Highlight màu rực rỡ từ đang phát âm",
    textBehavior: "active_word",
  },

  impact_text_bup: {
    name: "impact_text_bup",
    category: "text",
    duration_s: 0.3,
    description: "Chữ in hoa băm giật kèm rung nhẹ",
    textBehavior: "impact_bup",
  },

  typewriter_fast: {
    name: "typewriter_fast",
    category: "text",
    duration_s: 0.4,
    description: "Gõ chữ siêu tốc",
    textBehavior: "typewriter",
  },
};

function getMicroEffect(effectName) {
  if (!effectName) return null;
  const key = String(effectName).toLowerCase().trim();
  return MICRO_EFFECTS[key] || null;
}

module.exports = {
  MICRO_EFFECTS,
  getMicroEffect,
};
