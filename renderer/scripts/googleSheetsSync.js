/**
 * Direct Google Sheets Synchronizer for Auto-Video-Factory
 * 100% Dynamic Header-Mapped Syncing with Google Sheets API v4 (Service Account).
 */

const fs = require("fs");
const path = require("path");
const sheetsClient = require("./googleSheetsDirectClient");

const ROOT = path.resolve(__dirname, "..", "..");
const BACKUP_DIR = path.join(ROOT, "renderer", "output", "sheets_backup");
const STATS_PATH = path.join(ROOT, "effects", "effect_success_stats.json");

function getLocalDateTime() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

function ensureBackupDir() {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function appendCsvLine(filePath, headers, values) {
  ensureBackupDir();
  const fileExists = fs.existsSync(filePath);
  if (!fileExists) {
    fs.writeFileSync(filePath, `${headers.join(",")}\n`, "utf8");
  }

  const escaped = values.map((val) => {
    const str = String(val ?? "").replace(/"/g, '""');
    return `"${str}"`;
  });
  fs.appendFileSync(filePath, `${escaped.join(",")}\n`, "utf8");
}

async function syncProjectToSheet(projectData) {
  const jobId = projectData.projectId || projectData.job_id || "";
  if (!jobId) return;

  const projectDict = {
    job_id: jobId,
    status: projectData.status || "🎬 Rendered",
    input_file: projectData.inputFile || "",
    title: projectData.title || "",
    raw_caption: projectData.captionHashtags || projectData.raw_caption || "",
    original_duration: projectData.originalDuration || "",
    short_duration: projectData.shortDuration || "",
    scene_count: projectData.sceneCount || "",
    hook_score: projectData.hookScore || "",
    effects_summary: projectData.effectsSummary || "",
    video_path: projectData.outputFile || projectData.video_path || "",
    created_at: projectData.createdAt || getLocalDateTime(),
    rendered_at: projectData.renderedAt || getLocalDateTime(),
    brand_fb: projectData.brandFb || "",
    brand_yt: projectData.brandYt || "",
    brand_ig: projectData.brandIg || "",
    brand_tt: projectData.brandTt || "",
    brand_shopee: projectData.brandShopee || "",
    brand_zalo: projectData.brandZalo || ""
  };

  // 1. Direct Dynamic Header-Mapped Upsert
  try {
    await sheetsClient.upsertRowByHeader("Auto-Video-Factory", "job_id", jobId, projectDict);
    console.log(`[GoogleSheetDirect] ✅ Đã đồng bộ theo TÊN CỘT ĐỘNG cho dự án '${jobId}' (Tab Auto-Video-Factory).`);
  } catch (err) {
    console.warn(`[GoogleSheetDirect] WARN: Lỗi đồng bộ Direct API: ${err.message}`);
  }

  // 2. Local CSV Backup
  const csvPath = path.join(BACKUP_DIR, "projects_tracker.csv");
  const headers = [
    "job_id", "Status", "Input File", "title", "raw_caption", "Original Duration",
    "Short Duration", "Scene Count", "Opening Hook Score", "Effects Summary", "video_path",
    "Created At", "Rendered At", "brand_fb", "brand_yt", "brand_ig", "brand_tt", "brand_shopee", "brand_zalo"
  ];
  const row = [
    projectDict.job_id,
    projectDict.status,
    projectDict.input_file,
    projectDict.title,
    projectDict.raw_caption,
    projectDict.original_duration,
    projectDict.short_duration,
    projectDict.scene_count,
    projectDict.hook_score,
    projectDict.effects_summary,
    projectDict.video_path,
    projectDict.created_at,
    projectDict.rendered_at,
    projectDict.brand_fb,
    projectDict.brand_yt,
    projectDict.brand_ig,
    projectDict.brand_tt,
    projectDict.brand_shopee,
    projectDict.brand_zalo
  ];
  appendCsvLine(csvPath, headers, row);
}

async function syncScenesToSheet(projectId, scenes) {
  if (!scenes || !Array.isArray(scenes)) return;

  const rows = [];
  for (const s of scenes) {
    const textEffectName = typeof s.text_effect === "object" ? s.text_effect?.name : s.text_effect;
    const advEffectName = typeof s.advanced_effect === "object" ? s.advanced_effect?.name : s.advanced_effect;
    const transOutType = s.transition_out ? `${s.transition_out.type} (${s.transition_out.duration}s)` : "none";

    const startVal = s.start_s !== undefined ? s.start_s : s.start;
    const endVal = s.end_s !== undefined ? s.end_s : s.end;
    const durVal = s.duration_s !== undefined ? s.duration_s : s.duration;

    const subtitleText = s.text_content || s.subtitle || s.text || "";
    const voiceText = s.voice || s.voiceover || "";
    const visualText = s.visual_description || s.visual_cue || s.description || "";
    const styleText = `${s.subtitle_style || "default"} (${s.text_position || "bottom"})`;
    const effectText = `${advEffectName || "none"} (${s.advanced_effect?.camera_motion || "static"})`;

    rows.push([
      projectId,
      s.scene_id || s.id || "",
      s.scene_type || "body",
      `${startVal || 0}s - ${endVal || 0}s`,
      `${durVal || 0}s`,
      subtitleText,
      voiceText,
      visualText,
      styleText,
      effectText,
      transOutType
    ]);
  }

  // 1. Direct Google Sheets API v4
  try {
    await sheetsClient.appendValues("Video-Factory-SCENES!A1", rows);
    console.log(`[GoogleSheetDirect] ✅ Đã ghi ${rows.length} phân cảnh vào Google Sheets (Tab Video-Factory-SCENES).`);
  } catch (err) {
    console.warn(`[GoogleSheetDirect] WARN: Lỗi ghi scenes vào Google Sheets: ${err.message}`);
  }

  // 2. Local CSV Backup
  const csvPath = path.join(BACKUP_DIR, "scenes_detail.csv");
  const headers = [
    "Project ID", "Scene ID", "Scene Type", "Time (Start-End)", "Target Duration",
    "Subtitle", "Voice Text", "Visual Cue", "Subtitle Style", "Advanced Effect", "Transition Out"
  ];
  for (const r of rows) {
    appendCsvLine(csvPath, headers, r);
  }
}

async function syncAnalyticsToSheet() {
  let stats = {};
  try {
    if (fs.existsSync(STATS_PATH)) {
      stats = JSON.parse(fs.readFileSync(STATS_PATH, "utf8"));
    }
  } catch {}

  const rows = [];
  for (const [key, val] of Object.entries(stats)) {
    if (key === "_meta" || key === "fallback" || key === "none" || typeof val !== "object") continue;

    let type = "Advanced Effect";
    let cleanKey = key;
    if (key.startsWith("subtitle_style:")) {
      type = "Subtitle Style";
      cleanKey = key.replace("subtitle_style:", "");
    } else if (key.startsWith("transition_out:")) {
      type = "Transition Out";
      cleanKey = key.replace("transition_out:", "");
    } else if (key.startsWith("advanced_effect:")) {
      type = "Advanced Effect";
      cleanKey = key.replace("advanced_effect:", "");
    }

    const formattedKey = `[${type}] ${cleanKey}`;
    const success = val.success || 0;
    const fail = val.fail || 0;
    const total = success + fail;
    const rate = total > 0 ? ((success / total) * 100).toFixed(1) + "%" : "0%";
    const status = (success >= 5 && (success / Math.max(1, total)) >= 0.9) ? "Safe" : "Restricted";

    rows.push([formattedKey, success, fail, rate, status]);
  }

  const headers = ["Feature Key", "Success Count", "Fail Count", "Success Rate (%)", "Safe Pool Status"];

  // 1. Direct Google Sheets API v4
  try {
    await sheetsClient.overwriteSheet("Video-Factory-EFFECTS", headers, rows);
    console.log(`[GoogleSheetDirect] ✅ Đã cập nhật bảng Analytics hiệu ứng trên Google Sheets (Tab Video-Factory-EFFECTS).`);
  } catch (err) {
    console.warn(`[GoogleSheetDirect] WARN: Lỗi đồng bộ Analytics Google Sheet: ${err.message}`);
  }

  // 2. Local CSV Backup
  const csvPath = path.join(BACKUP_DIR, "effects_analytics.csv");
  ensureBackupDir();
  const lines = [headers.join(",")];
  for (const r of rows) {
    lines.push(`"${r[0]}","${r[1]}","${r[2]}","${r[3]}","${r[4]}"`);
  }
  fs.writeFileSync(csvPath, `${lines.join("\n")}\n`, "utf8");
}

module.exports = {
  getLocalDateTime,
  syncAnalyticsToSheet,
  syncProjectToSheet,
  syncScenesToSheet,
};
