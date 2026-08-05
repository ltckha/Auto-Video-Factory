/**
 * Velocity Engine (Priority 3) - CapCut / TikTok 2026 Trend
 * Computes multi-stage temporal speed ramps:
 * Normal -> FAST -> SLOW -> FAST -> Normal (Velocity Hit)
 */

const VELOCITY_PROFILES = {
  velocity_hit: {
    name: "velocity_hit",
    description: "Cú giật nảy Velocity Hit: Tua nhanh 2x -> Chậm 0.7x -> Nổi bật",
    computeSegments: (sourceDuration) => {
      const d = Math.max(0.5, sourceDuration);
      return [
        { from: 0, to: d * 0.3, speed: 1.0, importance: 0.8 },
        { from: d * 0.3, to: d * 0.5, speed: 2.2, importance: 0.5 },
        { from: d * 0.5, to: d * 0.8, speed: 0.7, importance: 1.2 },
        { from: d * 0.8, to: d, speed: 1.0, importance: 0.8 },
      ];
    },
  },

  velocity_ramp_in: {
    name: "velocity_ramp_in",
    description: "Tua nhanh 2.5x lúc vào cảnh rồi chậm dần mượt mà",
    computeSegments: (sourceDuration) => {
      const d = Math.max(0.5, sourceDuration);
      return [
        { from: 0, to: d * 0.4, speed: 2.5, importance: 0.5 },
        { from: d * 0.4, to: d, speed: 0.9, importance: 1.1 },
      ];
    },
  },

  velocity_ramp_out: {
    name: "velocity_ramp_out",
    description: "Tua nhanh 2.5x ở đoạn thoát cảnh",
    computeSegments: (sourceDuration) => {
      const d = Math.max(0.5, sourceDuration);
      return [
        { from: 0, to: d * 0.6, speed: 0.9, importance: 1.1 },
        { from: d * 0.6, to: d, speed: 2.5, importance: 0.5 },
      ];
    },
  },

  velocity_pulse: {
    name: "velocity_pulse",
    description: "Nhịp tua dồn dập giật nảy 2 nhịp theo tiếng trống",
    computeSegments: (sourceDuration) => {
      const d = Math.max(0.5, sourceDuration);
      return [
        { from: 0, to: d * 0.25, speed: 2.0, importance: 0.6 },
        { from: d * 0.25, to: d * 0.5, speed: 0.8, importance: 1.2 },
        { from: d * 0.5, to: d * 0.75, speed: 2.0, importance: 0.6 },
        { from: d * 0.75, to: d, speed: 0.8, importance: 1.2 },
      ];
    },
  },
};

function getVelocityProfile(profileName) {
  if (!profileName) return null;
  const key = String(profileName).toLowerCase().trim();
  return VELOCITY_PROFILES[key] || null;
}

module.exports = {
  VELOCITY_PROFILES,
  getVelocityProfile,
};
