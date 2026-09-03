const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "out");
const MANIFEST_DIR = path.join(OUT_DIR, "manifests");
const INCOMING_DIR = path.join(WORKSPACE_ROOT, "incoming");
const NAS_MOUNT_DIR = "/Volumes/Media/Auto-Video-Factory";
const LOCAL_ARCHIVE_DIR = path.join(WORKSPACE_ROOT, "archive");
const STATS_PATH = path.join(WORKSPACE_ROOT, "effects", "effect_success_stats.json");

fs.mkdirSync(MANIFEST_DIR, { recursive: true });

// Import Google Sheets sync and Caption generator
let googleSheetsSync = null;
let captionGenerator = null;
try {
  googleSheetsSync = require(path.join(WORKSPACE_ROOT, "renderer", "scripts", "googleSheetsSync.js"));
  captionGenerator = require(path.join(WORKSPACE_ROOT, "renderer", "scripts", "captionGenerator.js"));
} catch (err) {
  console.warn(`[SyncLoader] Warning loading Google Sheets sync: ${err.message}`);
}

function resolveArchiveDir() {
  if (fs.existsSync("/Volumes/Media")) {
    try {
      fs.mkdirSync(NAS_MOUNT_DIR, { recursive: true });
      return NAS_MOUNT_DIR;
    } catch (e) {
      console.warn(`[Archive] WARN: Không thể tạo thư mục trên NAS. Dùng local archive.`);
    }
  }
  return LOCAL_ARCHIVE_DIR;
}

function updateEffectSuccessStats(timelineJson, isSuccess) {
  if (!timelineJson || !Array.isArray(timelineJson.timeline)) return;
  try {
    let stats = {};
    if (fs.existsSync(STATS_PATH)) {
      stats = JSON.parse(fs.readFileSync(STATS_PATH, "utf8"));
    }

    const scenes = timelineJson.timeline.filter((s) => s.include !== false);
    for (const sc of scenes) {
      // 1. Track Subtitle Style
      if (sc.subtitle_style && sc.subtitle_style !== "none") {
        const key = `subtitle_style:${sc.subtitle_style}`;
        if (!stats[key]) stats[key] = { success: 0, fail: 0 };
        if (isSuccess) stats[key].success++;
        else stats[key].fail++;
      }

      // 2. Track Transition Out
      if (sc.transition_out && sc.transition_out.type) {
        const key = `transition_out:${sc.transition_out.type}`;
        if (!stats[key]) stats[key] = { success: 0, fail: 0 };
        if (isSuccess) stats[key].success++;
        else stats[key].fail++;
      }

      // 3. Track Camera Motion / Advanced Effect
      const effName = sc.advanced_effect?.name || sc.camera_motion;
      if (effName && effName !== "none") {
        const key = `advanced_effect:${effName}`;
        if (!stats[key]) stats[key] = { success: 0, fail: 0 };
        if (isSuccess) stats[key].success++;
        else stats[key].fail++;
      }
    }

    fs.writeFileSync(STATS_PATH, JSON.stringify(stats, null, 2), "utf8");
  } catch (err) {
    console.warn(`[EffectStats] WARN: Lỗi cập nhật effect_success_stats.json: ${err.message}`);
  }
}

function collectEnvironmentDiagnostics() {
  let ffmpegVersion = "unknown";
  let hasVideoToolbox = false;
  try {
    const ffOut = execSync("ffmpeg -version", { encoding: "utf8" });
    ffmpegVersion = ffOut.split("\n")[0] || "unknown";
    hasVideoToolbox = ffOut.includes("videotoolbox");
  } catch {}

  const totalMemGB = (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1);
  const freeMemGB = (os.freemem() / (1024 * 1024 * 1024)).toFixed(1);

  return {
    os_type: os.type(),
    os_release: os.release(),
    platform: os.platform(),
    arch: os.arch(),
    cpu_model: os.cpus()[0]?.model || "Apple Silicon",
    cpu_count: os.cpus().length,
    node_version: process.version,
    ffmpeg_version: ffmpegVersion,
    hardware_acceleration: hasVideoToolbox ? "h264_videotoolbox (Apple Silicon M4)" : "software",
    total_memory_gb: `${totalMemGB} GB`,
    free_memory_gb: `${freeMemGB} GB`,
  };
}

function probeMasterMedia(outputFilePath) {
  if (!fs.existsSync(outputFilePath)) return null;
  try {
    const probeCmd = `ffprobe -v error -show_entries format=duration,size,bit_rate -show_streams -of json "${outputFilePath}"`;
    const probeData = JSON.parse(execSync(probeCmd, { encoding: "utf8" }));
    const vStream = probeData.streams?.find((s) => s.codec_type === "video") || {};
    const aStream = probeData.streams?.find((s) => s.codec_type === "audio") || {};
    const format = probeData.format || {};

    const vDur = parseFloat(vStream.duration || format.duration || "0");
    const aDur = parseFloat(aStream.duration || format.duration || "0");
    const driftMs = Math.abs(vDur - aDur) * 1000;
    const sizeMB = parseFloat((parseInt(format.size || "0") / (1024 * 1024)).toFixed(2));

    return {
      width: vStream.width || 1080,
      height: vStream.height || 1920,
      fps: vStream.r_frame_rate || "30/1",
      duration_s: vDur,
      audio_duration_s: aDur,
      audio_sync_drift_ms: Number(driftMs.toFixed(2)),
      file_size_mb: sizeMB,
      sample_rate: parseInt(aStream.sample_rate || "48000"),
      channels: aStream.channels || 2,
    };
  } catch (err) {
    return null;
  }
}

function getPendingProjectList() {
  if (!fs.existsSync(INCOMING_DIR)) return [];
  return fs
    .readdirSync(INCOMING_DIR)
    .filter((f) => f.endsWith(".json") && !f.startsWith("."))
    .map((f) => f.replace(".json", ""))
    .sort();
}

async function orchestrateRenderSingle(projectId) {
  const renderEngine = (process.env.RENDER_ENGINE || "hybrid").toLowerCase().trim();
  const startTime = Date.now();
  const diagnostics = collectEnvironmentDiagnostics();

  console.log(`\n======================================================`);
  console.log(`🏭 AUTO-VIDEO-FACTORY MASTER ORCHESTRATOR (M6.2)`);
  console.log(`🎯 Project: ${projectId} | Engine Strategy: [${renderEngine.toUpperCase()}]`);
  console.log(`💻 Hardware: ${diagnostics.cpu_model} (${diagnostics.arch}) | Accel: ${diagnostics.hardware_acceleration}`);
  console.log(`======================================================\n`);

  let finalOutputFile = "";
  let engineUsed = "hybrid";
  let fallbackTriggered = false;
  let retryCount = 0;
  let styleUsed = "general_viral";
  let brandUsed = "general";
  let platformUsed = "tiktok";
  let timelineJson = null;

  // Locate Timeline metadata
  let incomingTimelinePath = path.join(INCOMING_DIR, `${projectId}.json`);
  let nasTimelinePath = path.join(resolveArchiveDir(), projectId, `${projectId}.json`);
  let timelinePath = fs.existsSync(incomingTimelinePath) ? incomingTimelinePath : nasTimelinePath;

  if (fs.existsSync(timelinePath)) {
    try {
      timelineJson = JSON.parse(fs.readFileSync(timelinePath, "utf8"));
      styleUsed = timelineJson.video_meta?.style || "general_viral";
      brandUsed = timelineJson.video_meta?.brand || "general";
      platformUsed = timelineJson.video_meta?.platform || "tiktok";
    } catch {}
  }

  const archiveBaseDir = resolveArchiveDir();
  const projectArchiveDir = path.join(archiveBaseDir, projectId);
  fs.mkdirSync(projectArchiveDir, { recursive: true });

  if (renderEngine === "legacy") {
    console.log(`[Orchestrator] 🅰️ Chạy trực tiếp qua FFmpeg Legacy Renderer (Production Lifeboat)...`);
    engineUsed = "legacy";
    const legacyScript = path.join(WORKSPACE_ROOT, "renderer", "scripts", "render.js");
    execSync(`node "${legacyScript}" "${projectId}"`, { stdio: "inherit" });
    finalOutputFile = path.join(projectArchiveDir, `${projectId}.mp4`);
  } else {
    // Primary: Hybrid Engine
    console.log(`[Orchestrator] 🅱️ Khởi chạy Primary Engine: Remotion Design Layer + FFmpeg Media Layer...`);
    const hybridScript = path.join(PROJECT_ROOT, "scripts", "render_hybrid.js");

    let attempt = 1;
    const maxAttempts = 2;
    let renderSuccess = false;

    while (attempt <= maxAttempts && !renderSuccess) {
      try {
        console.log(`[Orchestrator] 🚀 Đang render (Lần thử ${attempt}/${maxAttempts})...`);
        execSync(`node "${hybridScript}" "${projectId}"`, { stdio: "inherit" });
        renderSuccess = true;
        engineUsed = "hybrid";
        finalOutputFile = path.join(OUT_DIR, `${projectId}_m1_master.mp4`);
      } catch (err) {
        console.warn(`\n[Orchestrator] ⚠️ CẢNH BÁO: Lần thử ${attempt} gặp sự cố: ${err.message}`);
        retryCount++;
        attempt++;
      }
    }

    // Secondary: Automatic Fallback to Legacy if Hybrid Fails
    if (!renderSuccess) {
      console.warn(`\n[Orchestrator] 🚨 HYBRID ENGINE FAILED SAU ${maxAttempts} LẦN THỬ!`);
      console.log(`[Orchestrator] 🔄 TỰ ĐỘNG CHUYỂN HƯỚNG SANG FFmpeg Legacy Lifeboat Fallback...`);
      fallbackTriggered = true;
      engineUsed = "legacy_fallback";

      try {
        const legacyScript = path.join(WORKSPACE_ROOT, "renderer", "scripts", "render.js");
        execSync(`node "${legacyScript}" "${projectId}"`, { stdio: "inherit" });
        finalOutputFile = path.join(projectArchiveDir, `${projectId}.mp4`);
      } catch (legacyErr) {
        console.error(`[Orchestrator] ❌ FATAL: Cả Hybrid và Legacy Fallback đều thất bại: ${legacyErr.message}`);
        status = "FAILED";
      }
    }
  }

  const renderTimeMs = Date.now() - startTime;
  const mediaMetrics = probeMasterMedia(finalOutputFile) || {
    width: 1080,
    height: 1920,
    fps: "30/1",
    duration_s: 0,
    audio_duration_s: 0,
    audio_sync_drift_ms: 0,
    file_size_mb: 0,
    sample_rate: 48000,
    channels: 2,
  };

  // Generate Standard Production Manifest
  const manifest = {
    project_id: projectId,
    engine: engineUsed,
    renderer_version: "m6.2.0",
    style: styleUsed,
    brand: brandUsed,
    platform: platformUsed,
    output_file: path.join(projectArchiveDir, `${projectId}.mp4`),
    video_metrics: {
      resolution: `${mediaMetrics.width}x${mediaMetrics.height}`,
      fps: 30.0,
      duration_s: mediaMetrics.duration_s,
      file_size_mb: mediaMetrics.file_size_mb,
    },
    audio_metrics: {
      sample_rate: mediaMetrics.sample_rate,
      channels: mediaMetrics.channels,
      audio_duration_s: mediaMetrics.audio_duration_s,
      audio_sync_drift_ms: mediaMetrics.audio_sync_drift_ms,
      sync_status: mediaMetrics.audio_sync_drift_ms <= 30.0 ? "CODEC_ALIGNED" : "UNALIGNED",
    },
    performance: {
      render_time_ms: renderTimeMs,
      render_time_s: Number((renderTimeMs / 1000).toFixed(1)),
      memory_rss_mb: Number((process.memoryUsage().rss / (1024 * 1024)).toFixed(1)),
    },
    resilience: {
      fallback_triggered: fallbackTriggered,
      retry_count: retryCount,
    },
    environment: diagnostics,
    created_at: new Date().toISOString(),
    status,
  };

  const manifestPath = path.join(MANIFEST_DIR, `${projectId}_manifest.json`);
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), "utf8");

  // -------------------------------------------------------------
  // POST-RENDER: ARCHIVE, GOOGLE SHEETS SYNC, EFFECTS ANALYTICS & CLEANUP
  // -------------------------------------------------------------
  if (status === "SUCCESS") {
    console.log(`\n📦 [Post-Render 1/3] Đẩy file thành phẩm về Thư mục NAS/Archive: ${projectArchiveDir}...`);
    try {
      // 1. Copy Master MP4 to archive
      const targetMp4 = path.join(projectArchiveDir, `${projectId}.mp4`);
      if (fs.existsSync(finalOutputFile) && finalOutputFile !== targetMp4) {
        fs.copyFileSync(finalOutputFile, targetMp4);
      }

      // 2. Copy Timeline JSON to archive
      if (timelinePath && fs.existsSync(timelinePath)) {
        const targetJson = path.join(projectArchiveDir, `${projectId}.json`);
        if (timelinePath !== targetJson) {
          fs.copyFileSync(timelinePath, targetJson);
        }
      }

      // 3. Copy Manifest to archive
      fs.copyFileSync(manifestPath, path.join(projectArchiveDir, `${projectId}_manifest.json`));

      // 4. Generate post.txt
      if (captionGenerator && timelineJson) {
        const postText = captionGenerator.buildPostText(timelineJson);
        fs.writeFileSync(path.join(projectArchiveDir, "post.txt"), postText, "utf8");
        console.log(`[Post-Render] 📝 Đã tạo file post.txt: ${path.join(projectArchiveDir, "post.txt")}`);
      }
    } catch (e) {
      console.warn(`[Post-Render] WARN: Lỗi sao chép file sang archive: ${e.message}`);
    }

    // 5. Update Google Sheets (Auto-Video-Factory tab + Video-Factory-EFFECTS tab)
    if (googleSheetsSync && timelineJson) {
      console.log(`\n📊 [Post-Render 2/3] Cập nhật tiến độ lên Google Sheets (Tab Auto-Video-Factory & Video-Factory-EFFECTS)...`);
      try {
        const meta = timelineJson.video_meta || {};
        const hashtagsStr = Array.isArray(meta.hashtags) ? meta.hashtags.map(t => t.startsWith("#") ? t : `#${t}`).join(" ") : "";
        let fullCaptionText = "";
        if (captionGenerator && timelineJson) {
          fullCaptionText = captionGenerator.buildPostText(timelineJson);
        } else {
          const desc = meta.description || "";
          fullCaptionText = `${desc}\n\n${hashtagsStr}`.trim();
        }

        await googleSheetsSync.syncProjectToSheet({
          projectId,
          status: engineUsed === "hybrid" ? "🎬 Rendered (Remotion Hybrid)" : "🎬 Rendered (Legacy)",
          inputFile: meta.input_file || "",
          title: meta.title || "",
          captionHashtags: fullCaptionText,
          originalDuration: meta.original_duration_s || "",
          shortDuration: manifest.video_metrics.duration_s || "",
          sceneCount: (timelineJson.timeline || []).length,
          outputFile: path.join(projectArchiveDir, `${projectId}.mp4`),
          renderedAt: new Date().toLocaleString("vi-VN"),
        });

        // Record effect stats & update Video-Factory-EFFECTS tab
        updateEffectSuccessStats(timelineJson, true);
        await googleSheetsSync.syncAnalyticsToSheet();
      } catch (sheetErr) {
        console.warn(`[GoogleSheetSync] WARN: Lỗi đồng bộ Google Sheets: ${sheetErr.message}`);
      }
    }

    // 6. Cleanup Workspace & Incoming Debris for THIS project
    console.log(`\n🧹 [Post-Render 3/3] Tiến hành dọn dẹp file tạm và rác ổ đĩa...`);
    try {
      // Remove incoming JSON if it exists
      if (fs.existsSync(incomingTimelinePath)) {
        fs.unlinkSync(incomingTimelinePath);
        console.log(`[Cleanup] 🗑️ Đã xóa file kịch bản tạm: ${incomingTimelinePath}`);
      }

      // Remove incoming video copy if any
      const incomingMp4 = path.join(INCOMING_DIR, `${projectId}.mp4`);
      if (fs.existsSync(incomingMp4)) {
        fs.unlinkSync(incomingMp4);
      }

      // Remove incoming WAV voices
      if (fs.existsSync(INCOMING_DIR)) {
        const incomingFiles = fs.readdirSync(INCOMING_DIR);
        for (const f of incomingFiles) {
          if (f.startsWith(`${projectId}_`) && f.endsWith(".wav")) {
            fs.unlinkSync(path.join(INCOMING_DIR, f));
          }
        }
      }

      // Clean local out MP4 to save disk
      if (fs.existsSync(finalOutputFile) && finalOutputFile.startsWith(OUT_DIR)) {
        try { fs.unlinkSync(finalOutputFile); } catch {}
      }

      // Clean public/source_video.mp4
      const publicVideo = path.join(PROJECT_ROOT, "public", "source_video.mp4");
      if (fs.existsSync(publicVideo)) {
        fs.unlinkSync(publicVideo);
      }

      console.log(`[Cleanup] ✨ Đã dọn dẹp sạch sẽ toàn bộ file tạm của dự án ${projectId}!`);
    } catch (cleanErr) {
      console.warn(`[Cleanup] WARN: Lỗi dọn dẹp: ${cleanErr.message}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`📜 PRODUCTION MANIFEST GENERATED: ${manifestPath}`);
  console.log(`  - Trạng thái: ${status === "SUCCESS" ? "✅ SUCCESS" : "❌ FAILED"}`);
  console.log(`  - Engine: [${engineUsed.toUpperCase()}] | Fallback: ${fallbackTriggered ? "YES ⚠️" : "NO ✅"}`);
  console.log(`  - File Master NAS: ${path.join(projectArchiveDir, `${projectId}.mp4`)}`);
  console.log(`  - Thời gian render: ${manifest.performance.render_time_s}s`);
  console.log(`  - Audio Sync Drift: ${manifest.audio_metrics.audio_sync_drift_ms} ms (${manifest.audio_metrics.sync_status})`);
  console.log(`======================================================\n`);

  return manifest;
}

async function orchestrateMain() {
  const explicitProject = process.argv[2];
  if (explicitProject) {
    await orchestrateRenderSingle(explicitProject);
    return;
  }

  const pendingProjects = getPendingProjectList();
  if (pendingProjects.length === 0) {
    console.log(`[Orchestrator] ℹ️ Không tìm thấy kịch bản JSON nào đang chờ trong incoming/. Chạy dự án mẫu...`);
    await orchestrateRenderSingle("7543179816128843046_short01");
    return;
  }

  console.log(`\n======================================================`);
  console.log(`📦 BATCH QUEUE DETECTED: Phát hiện ${pendingProjects.length} dự án đang chờ trong incoming/`);
  console.log(`🎯 Danh sách: ${pendingProjects.join(", ")}`);
  console.log(`======================================================\n`);

  for (let i = 0; i < pendingProjects.length; i++) {
    const projId = pendingProjects[i];
    console.log(`\n======================================================`);
    console.log(`🎬 [TIẾN TRÌNH HÀNG ĐỢI ${i + 1}/${pendingProjects.length}] Bắt đầu render: ${projId}`);
    console.log(`======================================================`);
    await orchestrateRenderSingle(projId);
  }

  // Clean temp_concat after entire batch completes
  const tempConcatDir = path.join(INCOMING_DIR, "temp_concat");
  if (fs.existsSync(tempConcatDir)) {
    for (const entry of fs.readdirSync(tempConcatDir)) {
      if (entry === ".DS_Store") continue;
      try { fs.rmSync(path.join(tempConcatDir, entry), { recursive: true, force: true }); } catch {}
    }
  }

  console.log(`\n======================================================`);
  console.log(`🎉 ĐÃ HOÀN TẤT RENDER TOÀN BỘ ${pendingProjects.length} DỰ ÁN TRONG HÀNG ĐỢI!`);
  console.log(`======================================================\n`);
}

if (require.main === module) {
  orchestrateMain().catch((err) => {
    console.error("Fatal Orchestrator error:", err.message);
    process.exit(1);
  });
}

module.exports = {
  orchestrateRender: orchestrateRenderSingle,
  orchestrateMain,
  collectEnvironmentDiagnostics,
};
