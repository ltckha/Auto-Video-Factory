const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(ROOT, "..");
const BACKLOG_FILE = path.join(WORKSPACE_ROOT, "effects", "EFFECTS_BACKLOG_AND_FEEDBACK.md");

const KNOWN_CAMERA_MOTIONS = new Set([
  "macro_push",
  "punch_zoom",
  "drift_cam",
  "snap_zoom",
  "cinematic_glide_zoom",
  "static",
  "push_in",
  "snap",
  "drift",
  "pulse",
  "slow_zoom_in",
  "pull_out",
  "push_out",
]);

const KNOWN_TRANSITIONS = new Set([
  "circle_open",
  "iris",
  "paper_rip",
  "tear",
  "wipe_right",
  "wipe_left",
  "wipe_up",
  "wipe_down",
  "slide_up",
  "slide_down",
  "slide_left",
  "slide_right",
  "flip",
  "fade",
  "none",
  "",
]);

const KNOWN_SUBTITLE_STYLES = new Set([
  "minimal_glass_card",
  "vibrant_yellow_sticker",
  "warning_red_badge",
  "vibrant_yellow_lightning_sticker",
  "vibrant_yellow_light",
  "washi_tape",
  "editorial_line",
  "price_tag_pill",
  "neon_glow",
  "editorial_eyebrow",
  "bracketed_spec",
  "step_flow",
  "centered",
  "none",
  "",
]);

/**
 * Normalizes string for easy matching
 */
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "_");
}

/**
 * Inspects timeline scenes and logs any unbuilt gaps directly to EFFECTS_BACKLOG_AND_FEEDBACK.md
 *
 * @param {string} projectId Name of project being rendered
 * @param {object} timelineJson Parsed timeline JSON
 * @returns {Array} List of detected gaps
 */
function inspectTimelineAndRecordGaps(projectId, timelineJson) {
  if (!timelineJson || !Array.isArray(timelineJson.timeline)) {
    return [];
  }

  const scenes = timelineJson.timeline.filter((sc) => sc.include !== false);
  const gaps = [];

  scenes.forEach((sc, index) => {
    const sceneId = sc.scene_id || `scene_${String(index + 1).padStart(3, "0")}`;

    // 1. Check Camera Motion / Advanced Effect
    const rawMotion = sc.advanced_effect?.camera_motion || sc.advanced_effect?.name || sc.camera_motion || "";
    const normMotion = normalize(rawMotion);
    if (rawMotion && !KNOWN_CAMERA_MOTIONS.has(normMotion)) {
      // Check if it's in learned_effects mapping
      let isMapped = false;
      try {
        const learned = require(path.join(WORKSPACE_ROOT, "effects", "learned_effects.json"));
        if (learned && (learned[rawMotion] || learned[normMotion])) {
          isMapped = true;
        }
      } catch {}

      if (!isMapped) {
        gaps.push({
          sceneId,
          type: "Camera Motion / Effect",
          requested: rawMotion,
          fallback: "macro_push (Mặc định mượt mà)",
          recommendation: `Bổ sung Motion Primitive: \`${normMotion}\` vào cameraPrimitives.ts`,
        });
      }
    }

    // 2. Check Transition Out
    const rawTrans = sc.transition_out?.type || sc.transition_out || "";
    const normTrans = normalize(rawTrans);
    if (rawTrans && !KNOWN_TRANSITIONS.has(normTrans)) {
      gaps.push({
        sceneId,
        type: "Transition",
        requested: rawTrans,
        fallback: "fade (Mờ mềm an toàn)",
        recommendation: `Bổ sung Transition Shaper: \`${normTrans}\` vào transitionShapers.ts`,
      });
    }

    // 3. Check Subtitle Style
    const rawSub = sc.subtitle_style || "";
    const normSub = normalize(rawSub);
    if (rawSub && !KNOWN_SUBTITLE_STYLES.has(normSub)) {
      gaps.push({
        sceneId,
        type: "Subtitle Card",
        requested: rawSub,
        fallback: "minimal_glass_card (Thẻ kính tối giản)",
        recommendation: `Bổ sung Card Theme: \`${normSub}\` vào SubtitleCard.tsx`,
      });
    }

    // 4. Check Advanced Multi-Screen / Layout keywords
    const descText = [
      sc.visual_description || "",
      sc.voiceover || "",
      sc.audio_strategy || "",
      sc.layout || "",
    ].join(" ").toLowerCase();

    if (descText.includes("split screen") || descText.includes("chia man hinh") || descText.includes("collage") || descText.includes("3 screen")) {
      gaps.push({
        sceneId,
        type: "Multi-Screen Layout",
        requested: "multi_screen_split_collage",
        fallback: "Single Screen Full 9:16",
        recommendation: "Xây dựng Component: MultiScreenCollage.tsx trong Remotion",
      });
    }

    if (descText.includes("3d lut") || descText.includes("lut .cube") || descText.includes("teal orange lut")) {
      gaps.push({
        sceneId,
        type: "Color Grading LUT",
        requested: "3d_lut_cube_filter",
        fallback: "FFmpeg eq (contrast=1.02, saturation=1.04)",
        recommendation: "Tích hợp bộ lọc nạp file .cube vào FFmpeg Media Layer",
      });
    }
  });

  if (gaps.length === 0) {
    return [];
  }

  // Print friendly notification to console
  console.log(`\n======================================================`);
  console.log(`📡 [EffectTelemetry] PHÁT HIỆN ${gaps.length} TÍNH NĂNG CHƯA CÓ CODE THỰC THI RIÊNG:`);
  gaps.forEach((g) => {
    console.log(`   ⚠️ [${g.sceneId}] ${g.type}: "${g.requested}"`);
    console.log(`      ↳ Fallback đang dùng: ${g.fallback}`);
    console.log(`      ↳ Đề xuất nâng cấp  : ${g.recommendation}`);
  });
  console.log(`   📝 Đang tự động lưu vào: effects/EFFECTS_BACKLOG_AND_FEEDBACK.md...`);
  console.log(`======================================================\n`);

  // Record into effects/EFFECTS_BACKLOG_AND_FEEDBACK.md
  try {
    recordGapsToBacklog(projectId, gaps);
    console.log(`✅ [EffectTelemetry] Đã ghi nhận thành công vào Hàng Đợi Nâng Cấp Backlog!\n`);
  } catch (err) {
    console.warn(`⚠️ [EffectTelemetry] Không thể ghi file backlog: ${err.message}`);
  }

  return gaps;
}

/**
 * Appends new gap rows to EFFECTS_BACKLOG_AND_FEEDBACK.md
 */
function recordGapsToBacklog(projectId, gaps) {
  if (!fs.existsSync(BACKLOG_FILE)) return;

  let content = fs.readFileSync(BACKLOG_FILE, "utf8");

  // Format today's timestamp (e.g. 03/09/2026 15:30)
  const now = new Date();
  const timeStr = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()} ${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const headerMarker = "## 🚨 PHẦN 3: HÀNG ĐỢI NÂNG CẤP TỰ ĐỘNG TỪ THỰC TẾ RENDER (AUTO-DETECTED RUNTIME GAPS)";

  if (!content.includes(headerMarker)) {
    content += `\n\n---\n\n${headerMarker}\n\n> **Cơ chế tự động:** Khi bạn chạy \`render.command\`, nếu phân cảnh nào yêu cầu hiệu ứng / kỹ xảo chưa có code thực thi riêng, hệ thống sẽ tự động dùng fallback an toàn để video vẫn ra thành phẩm đẹp, đồng thời **tự động ghi ngay vào bảng dưới đây** để lần sau chúng ta xây dựng bổ sung.\n\n| Thời Gian | Dự Án Yêu Cầu | Phân Cảnh | Hiệu Ứng / Kỹ Xảo Chưa Có Code | Fallback Đã Dùng | Đề Xuất Nâng Cấp Cho Lần Sau |\n| :--- | :--- | :---: | :--- | :--- | :--- |\n`;
  }

  // Append each gap row if not already in content
  for (const gap of gaps) {
    const rowSignature = `| \`${projectId}\` | ${gap.sceneId} | \`${gap.requested}\``;
    if (content.includes(rowSignature)) {
      continue; // Prevent duplicate rows for same project/scene/effect
    }

    const row = `| \`${timeStr}\` | \`${projectId}\` | ${gap.sceneId} | \`${gap.requested}\` (${gap.type}) | ${gap.fallback} | ${gap.recommendation} |\n`;
    content += row;
  }

  fs.writeFileSync(BACKLOG_FILE, content, "utf8");
}

module.exports = {
  inspectTimelineAndRecordGaps,
  KNOWN_CAMERA_MOTIONS,
  KNOWN_TRANSITIONS,
  KNOWN_SUBTITLE_STYLES,
  normalize,
};

