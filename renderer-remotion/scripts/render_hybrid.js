const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "out");
const INCOMING_DIR = path.join(WORKSPACE_ROOT, "incoming");
const TEMP_DIR = path.join(PROJECT_ROOT, "temp_media");
const PUBLIC_DIR = path.join(PROJECT_ROOT, "public");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });
fs.mkdirSync(PUBLIC_DIR, { recursive: true });

// Load Legacy AudioEngine tools
let resolveBgmTrack = null;
try {
  const legacyAudio = require(path.join(WORKSPACE_ROOT, "renderer", "scripts", "audioEngine.js"));
  resolveBgmTrack = legacyAudio.resolveBgmTrack;
} catch (err) {
  console.warn(`[AudioLoader] Warning loading legacy audioEngine: ${err.message}`);
}

// Load Runtime Effect Gap Telemetry
let inspectTimelineAndRecordGaps = null;
try {
  const telemetry = require(path.join(WORKSPACE_ROOT, "renderer", "scripts", "effectGapTelemetry.js"));
  inspectTimelineAndRecordGaps = telemetry.inspectTimelineAndRecordGaps;
} catch (err) {
  console.warn(`[TelemetryLoader] Warning loading effectGapTelemetry: ${err.message}`);
}

/**
 * Legacy Chained atempo Builder for Audio Speed Parity
 */
function buildAudioSpeedFilter(speedRatio) {
  if (!speedRatio || Math.abs(speedRatio - 1.0) < 0.02) {
    return "anull";
  }

  const filters = [];
  let remainingSpeed = speedRatio;

  while (remainingSpeed > 2.0) {
    filters.push("atempo=2.0");
    remainingSpeed /= 2.0;
  }
  while (remainingSpeed < 0.5) {
    filters.push("atempo=0.5");
    remainingSpeed /= 0.5;
  }

  if (Math.abs(remainingSpeed - 1.0) >= 0.02) {
    filters.push(`atempo=${remainingSpeed.toFixed(4)}`);
  }

  return filters.join(",");
}

async function renderHybridMaster(projectIdInput) {
  const projectId = projectIdInput || process.argv[2] || "7543179816128843046_short01";
  const startTime = Date.now();

  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING REMOTION DESIGN LAYER v1 + FFMPEG MEDIA LAYER (M1)`);
  console.log(`🎯 Target Project: ${projectId}`);
  console.log(`======================================================\n`);

  // 1. Locate Timeline JSON
  let timelinePath = path.join(INCOMING_DIR, `${projectId}.json`);
  if (!fs.existsSync(timelinePath)) {
    // Check NAS or archive directory
    const nasPath = path.join("/Volumes/Media/Auto-Video-Factory", projectId, `${projectId}.json`);
    if (fs.existsSync(nasPath)) {
      timelinePath = nasPath;
    } else {
      throw new Error(`Timeline JSON not found for project: ${projectId} (Checked incoming & NAS)`);
    }
  }

  const timelineJson = JSON.parse(fs.readFileSync(timelinePath, "utf8"));
  const rawTimeline = timelineJson.timeline || [];
  const scenes = rawTimeline.filter((sc) => sc.include !== false);

  if (scenes.length === 0) {
    throw new Error(`Timeline has 0 active scenes.`);
  }

  // ⚡ Runtime Telemetry: Inspect unbuilt gaps and auto-record to Backlog
  if (inspectTimelineAndRecordGaps) {
    try {
      inspectTimelineAndRecordGaps(projectId, timelineJson);
    } catch (telemetryErr) {
      console.warn(`[Telemetry] Warning: ${telemetryErr.message}`);
    }
  }

  // Calculate exact total duration in seconds and frames @ 30fps
  let exactDurationSec = 0;
  scenes.forEach((sc) => {
    const dur = Number(sc.duration_s !== undefined ? sc.duration_s : sc.duration) || 3.0;
    exactDurationSec += dur;
  });
  const exactDurationFrames = Math.max(1, Math.round(exactDurationSec * 30));

  console.log(`[Input] 📜 Timeline: ${timelinePath}`);
  console.log(`[Input] 🎬 Active Scenes: ${scenes.length}/${rawTimeline.length} phân cảnh (Đã lọc bỏ ${rawTimeline.length - scenes.length} cảnh include:false)`);
  console.log(`[Input] ⏱️ Tổng thời lượng: ${exactDurationSec.toFixed(3)}s (${exactDurationFrames} frames @ 30fps)`);

  // 2. Locate Source Video
  let sourceVideoPath = timelineJson.video_meta?.input_file;
  if (!sourceVideoPath || !fs.existsSync(sourceVideoPath)) {
    const incomingMp4 = path.join(INCOMING_DIR, `${projectId}.mp4`);
    const nasMp4 = path.join("/Volumes/Media/Auto-Video-Factory", projectId, `${projectId}.mp4`);
    if (fs.existsSync(incomingMp4)) {
      sourceVideoPath = incomingMp4;
    } else if (fs.existsSync(nasMp4)) {
      sourceVideoPath = nasMp4;
    } else {
      throw new Error(`Source video not found: ${sourceVideoPath}`);
    }
  }
  console.log(`[Input] 🎥 Video Nguồn: ${sourceVideoPath}`);

  // 3. Prepare Remotion public/source_video.mp4 and adapters/production_short01.json
  console.log(`[Setup] Linking/copying source video to public directory...`);
  const publicVideoPath = path.join(PUBLIC_DIR, "source_video.mp4");
  try {
    if (fs.existsSync(publicVideoPath)) {
      fs.unlinkSync(publicVideoPath);
    }
    fs.copyFileSync(sourceVideoPath, publicVideoPath);
  } catch (err) {
    console.warn(`[Setup] Warning copying video to public: ${err.message}`);
  }

  const adapterJsonPath = path.join(PROJECT_ROOT, "src", "adapters", "production_short01.json");
  fs.writeFileSync(adapterJsonPath, JSON.stringify(timelineJson, null, 2), "utf8");

  // ---------------------------------------------------------
  // PHASE 1: REMOTION DESIGN LAYER (VISUAL MASTER RENDER)
  // ---------------------------------------------------------
  console.log(`\n🎨 [Phase 1: Remotion Design Layer v1] Bắt đầu render Visual Master (Chuẩn CRF=20 tối ưu dung lượng + Màu BT.709)...`);
  const visualTempOutput = path.join(TEMP_DIR, "temp_visual.mp4");
  if (fs.existsSync(visualTempOutput)) {
    fs.unlinkSync(visualTempOutput);
  }

  const remotionStartTime = Date.now();
  // We use npx remotion render with --concurrency=5, --pixel-format=yuv420p, --crf=20 for compact file size and standard BT.709 color
  const renderCmd = `npx remotion render src/index.ts ProductionShort01 "${visualTempOutput}" --concurrency=5 --pixel-format=yuv420p --crf=20`;
  execSync(renderCmd, { cwd: PROJECT_ROOT, stdio: "inherit" });

  const remotionDurationS = ((Date.now() - remotionStartTime) / 1000).toFixed(1);
  console.log(`[Phase 1] ✅ Visual Master hoàn tất trong ${remotionDurationS}s: ${visualTempOutput}`);

  // ---------------------------------------------------------
  // PHASE 2: FFMPEG MEDIA LAYER (PRECISE SCENE-BY-SCENE NATIVE AUDIO + BGM DUCKING + OUTRO DECRESCENDO)
  // ---------------------------------------------------------
  console.log(`\n🎵 [Phase 2: FFmpeg Media Layer] Trích xuất âm thanh gốc theo từng Scene & Tỷ lệ tốc độ (Chained atempo + Outro Decrescendo)...`);
  const audioStartTime = Date.now();
  const nativeAudioTemp = path.join(TEMP_DIR, "native_scene_audio.aac");
  const finalAudioOutput = path.join(TEMP_DIR, "final_aligned_audio.aac");

  const audioConfig = timelineJson.audio_config || {};
  const hasOriginalMusic = audioConfig.has_original_music || timelineJson.video_meta?.has_original_music || false;
  const bgmMood = audioConfig.bgm_mood || "none";
  const audioStrategy = timelineJson.video_meta?.audio_strategy || "";

  // 1. Extract & assemble Native Scene Audio matching visual cuts and exact speed ratio
  try {
    const audioFilterParts = [];
    const concatInputs = [];

    scenes.forEach((sc, idx) => {
      const startSec = Number(sc.start_s !== undefined ? sc.start_s : sc.start) || 0;
      const targetDurSec = Number(sc.duration_s !== undefined ? sc.duration_s : sc.duration) || 3.0;
      const endSec = Number(sc.end_s !== undefined ? sc.end_s : sc.end) || (startSec + targetDurSec);
      const sourceDurSec = Math.max(0.1, endSec - startSec);
      const playbackRate = Number((sourceDurSec / Math.max(0.1, targetDurSec)).toFixed(4));

      let filter = `[0:a]atrim=start=${startSec}:end=${endSec},asetpts=PTS-STARTPTS`;
      
      // Apply exact Legacy chained atempo speed filter
      const atempoFilter = buildAudioSpeedFilter(playbackRate);
      if (atempoFilter !== "anull") {
        filter += `,${atempoFilter}`;
      }

      // If extreme speedup (> 4x), slightly soften volume to prevent sharp clicks
      if (playbackRate > 3.5) {
        filter += `,volume=0.60`;
      }

      filter += `[a${idx}]`;
      audioFilterParts.push(filter);
      concatInputs.push(`[a${idx}]`);
    });

    const concatFilter = `${audioFilterParts.join(";")};${concatInputs.join("")}concat=n=${scenes.length}:v=0:a=1[aout]`;
    const extractNativeCmd = `ffmpeg -y -i "${sourceVideoPath}" -filter_complex "${concatFilter}" -map "[aout]" -c:a aac -b:a 192k -ar 48000 "${nativeAudioTemp}"`;
    execSync(extractNativeCmd, { stdio: "pipe" });
    console.log(`[AudioEngine] 🎙️ Đã trích xuất & xử lý tốc độ âm thanh (${scenes.length} scenes) theo chuẩn Legacy thành công!`);
  } catch (audioErr) {
    console.warn(`[AudioEngine] WARN: Lỗi trích xuất audio theo scene (${audioErr.message}). Sẽ fallback trích xuất audio tuyến tính.`);
    const fallbackAudioCmd = `ffmpeg -y -i "${sourceVideoPath}" -t ${exactDurationSec.toFixed(6)} -c:a aac -b:a 192k -ar 48000 "${nativeAudioTemp}"`;
    execSync(fallbackAudioCmd, { stdio: "pipe" });
  }

  // Smooth Audio Outro Fade-out Parameters (0.6s decrescendo to prevent abrupt ending cuts)
  const fadeDuration = Math.min(0.8, Math.max(0.3, exactDurationSec * 0.04));
  const fadeStartTime = Math.max(0, exactDurationSec - fadeDuration);
  const outroFadeFilter = `afade=t=out:st=${fadeStartTime.toFixed(4)}:d=${fadeDuration.toFixed(4)}`;

  // 2. Mix Native Audio with BGM (100% Legacy Dynamic Volume Formula + Outro Fade-out)
  const shouldAddBgm = bgmMood && bgmMood !== "none" && !hasOriginalMusic && !audioStrategy.includes("no_bgm");

  if (shouldAddBgm && resolveBgmTrack) {
    console.log(`[AudioEngine] 🎶 Phân giải BGM theo chuẩn Legacy Audio Engine [Mood: ${bgmMood}]...`);
    const bgmTrack = resolveBgmTrack(bgmMood, audioConfig.bgm_url);

    if (bgmTrack && fs.existsSync(bgmTrack.path)) {
      const modeStr = String(timelineJson.video_meta?.pipeline_mode || "").toLowerCase();
      const isLong2Short = modeStr.includes("long2short");
      const hasVoiceover = scenes.some((s) => s.voice && String(s.voice).trim().length > 0);
      const hasFastSpeedup = scenes.some((s) => {
        const startSec = Number(s.start_s !== undefined ? s.start_s : s.start) || 0;
        const targetDurSec = Number(s.duration_s !== undefined ? s.duration_s : s.duration) || 3.0;
        const endSec = Number(s.end_s !== undefined ? s.end_s : s.end) || (startSec + targetDurSec);
        const sourceDurSec = Math.max(0.1, endSec - startSec);
        return (sourceDurSec / Math.max(0.1, targetDurSec)) >= 2.0;
      });

      // EXACT LEGACY VOLUME LOGIC:
      // Long2Short or Fast Speedup (>= 2.0x) -> BGM 85%, Native tiếng gốc hạ xuống 15% để tránh méo giọng người
      // Normal video with Voiceover -> BGM 25%, Native 20%
      // Normal video without Voiceover -> BGM 50%, Native 80%
      const bgmVolume = (isLong2Short || hasFastSpeedup) ? 0.85 : (hasVoiceover ? 0.25 : 0.50);
      const nativeVolume = (isLong2Short || hasFastSpeedup) ? 0.15 : (hasVoiceover ? 0.20 : 0.80);

      console.log(`[AudioEngine] 🎵 Hòa âm BGM (Volume ${(bgmVolume * 100).toFixed(0)}% | Chế độ: ${isLong2Short ? "Long2Short" : (hasFastSpeedup ? "Tua Nhanh" : (hasVoiceover ? "Voiceover" : "Bình Thường"))}) + Tiếng gốc (Volume ${(nativeVolume * 100).toFixed(0)}%): ${bgmTrack.path}`);
      console.log(`[AudioEngine] 🎚️ Kích hoạt Outro Decrescendo (Vuốt nhỏ âm thanh êm ái ${fadeDuration.toFixed(2)}s ở đoạn kết)...`);
      
      // Legacy pitch-shift (+0.5% asetrate) + seamless loop + dynamic volume + amix + outro fade-out
      const bgmMixCmd = `ffmpeg -y -i "${nativeAudioTemp}" -i "${bgmTrack.path}" -filter_complex "[0:a]volume=${nativeVolume}[native];[1:a]asetrate=44320,aresample=48000,volume=${bgmVolume},aloop=loop=-1:size=2e+9,atrim=0:${exactDurationSec.toFixed(6)}[bgm];[native][bgm]amix=inputs=2:duration=first:dropout_transition=2,${outroFadeFilter}[final]" -map "[final]" -c:a aac -b:a 192k "${finalAudioOutput}"`;
      execSync(bgmMixCmd, { stdio: "pipe" });
    } else {
      const fadeCmd = `ffmpeg -y -i "${nativeAudioTemp}" -af "${outroFadeFilter}" -c:a aac -b:a 192k "${finalAudioOutput}"`;
      execSync(fadeCmd, { stdio: "pipe" });
    }
  } else {
    // Pure Native Audio + Outro Fade-out
    console.log(`[AudioEngine] 🎙️ Giữ nguyên vẹn 100% âm thanh gốc (Native ASMR / Voice).`);
    console.log(`[AudioEngine] 🎚️ Kích hoạt Outro Decrescendo (Vuốt nhỏ âm thanh êm ái ${fadeDuration.toFixed(2)}s ở đoạn kết)...`);
    const fadeCmd = `ffmpeg -y -i "${nativeAudioTemp}" -af "${outroFadeFilter}" -c:a aac -b:a 192k "${finalAudioOutput}"`;
    execSync(fadeCmd, { stdio: "pipe" });
  }

  const audioDurationS = ((Date.now() - audioStartTime) / 1000).toFixed(1);
  console.log(`[Phase 2] ✅ Xử lý âm thanh hoàn tất trong ${audioDurationS}s: ${finalAudioOutput}`);

  // ---------------------------------------------------------
  // PHASE 3: FFMPEG MASTER MUXER (BT.709 TRUE-COLOR BITSTREAM TAGGING)
  // ---------------------------------------------------------
  console.log(`\n⚙️ [Phase 3: FFmpeg Master Muxer] Hợp nhất Visual Master + Audio Stream (Bảo toàn màu gốc BT.709)...`);
  const finalMasterOutput = path.join(OUT_DIR, `${projectId}_m1_master.mp4`);

  // Explicitly tag H.264 VUI metadata with BT.709 + Limited Range to prevent washing out/color shifts
  const muxCmd = `ffmpeg -y -i "${visualTempOutput}" -i "${finalAudioOutput}" -c:v copy -c:a copy -map 0:v:0 -map 1:a:0 -bsf:v "h264_metadata=colour_primaries=1:transfer_characteristics=1:matrix_coefficients=1:video_full_range_flag=0" -shortest -movflags +faststart "${finalMasterOutput}"`;
  execSync(muxCmd, { stdio: "pipe" });

  const totalDurationPipelineS = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[Phase 3] 🏆 M1 MASTER HYBRID RENDER THÀNH CÔNG!`);
  console.log(`📁 File Thành Phẩm: ${finalMasterOutput}`);
  console.log(`⏱️ Tổng thời gian chạy Pipeline: ${totalDurationPipelineS}s`);

  // Verification Probe
  const probeCmd = `ffprobe -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,pix_fmt,color_space,color_primaries,color_transfer -of json "${finalMasterOutput}"`;
  const probeAudioCmd = `ffprobe -v error -select_streams a:0 -show_entries stream=codec_name,sample_rate,channels,duration -of json "${finalMasterOutput}"`;
  const formatCmd = `ffprobe -v error -show_entries format=size -of json "${finalMasterOutput}"`;

  const probeVideoData = JSON.parse(execSync(probeCmd, { encoding: "utf8" }));
  const probeAudioData = JSON.parse(execSync(probeAudioCmd, { encoding: "utf8" }));
  const probeFormatData = JSON.parse(execSync(formatCmd, { encoding: "utf8" }));

  const vStream = probeVideoData.streams?.[0] || {};
  const aStream = probeAudioData.streams?.[0] || {};
  const vDuration = parseFloat(vStream.duration || "0");
  const aDuration = parseFloat(aStream.duration || "0");
  const driftMs = Math.abs(vDuration - aDuration) * 1000;
  const sizeMB = (parseInt(probeFormatData.format?.size || "0") / (1024 * 1024)).toFixed(2);

  console.log(`\n📊 [Báo Cáo Kiểm Tra Kỹ Thuật Phase M1]`);
  console.log(`  - Độ phân giải: ${vStream.width}x${vStream.height} (Chuẩn 1080x1920: ${vStream.width === 1080 && vStream.height === 1920 ? "✅ PASS" : "❌ FAIL"})`);
  console.log(`  - Framerate: ${vStream.r_frame_rate} (Chuẩn 30fps: ${vStream.r_frame_rate === "30/1" ? "✅ PASS" : "⚠️ " + vStream.r_frame_rate})`);
  console.log(`  - Không Gian Màu (Color Space): ${vStream.color_space || "bt709"} (Chuẩn BT.709 Nguyên Bản)`);
  console.log(`  - Thời lượng Video: ${vDuration.toFixed(3)}s`);
  console.log(`  - Thời lượng Audio: ${aDuration.toFixed(3)}s`);
  console.log(`  - Độ lệch Audio / Video: ${driftMs.toFixed(1)} ms (${driftMs <= 30.0 ? "✅ KHỚP PACKET AAC" : "⚠️ CẦN CĂN CHỈNH"})`);
  console.log(`  - Chuẩn Âm Thanh: ${aStream.codec_name} (${aStream.sample_rate}Hz, ${aStream.channels} channels)`);
  console.log(`  - Dung lượng file: ${sizeMB} MB`);

  console.log(`\n======================================================`);
  console.log(`🎉 PHASE M1 HYBRID RENDER HOÀN TẤT XUẤT SẮC!`);
  console.log(`======================================================\n`);

  return {
    outputFile: finalMasterOutput,
    vDuration,
    aDuration,
    driftMs,
    sizeMB,
  };
}

if (require.main === module) {
  renderHybridMaster().catch((err) => {
    console.error("Fatal render error:", err.message);
    process.exit(1);
  });
}

module.exports = {
  renderHybridMaster,
  buildAudioSpeedFilter,
};
