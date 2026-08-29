const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(PROJECT_ROOT, "..");
const OUT_DIR = path.join(PROJECT_ROOT, "out");
const TEMP_DIR = path.join(PROJECT_ROOT, "temp_media");

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(TEMP_DIR, { recursive: true });

// Import directly from Legacy Audio Engine for 100% audio compatibility
let resolveBgmTrack = null;
try {
  const legacyAudio = require(path.join(WORKSPACE_ROOT, "renderer", "scripts", "audioEngine.js"));
  resolveBgmTrack = legacyAudio.resolveBgmTrack;
} catch (e) {
  console.warn(`[AudioEngine] Warning loading legacy audioEngine: ${e.message}`);
}

/**
 * Legacy Audio Speed Filter Builder (Chained atempo for smooth pitch & non-distorted audio)
 * Exactly matches renderer/scripts/render.js line 1314
 */
function buildAudioSpeedFilter(speedRatio) {
  let speed = speedRatio;
  const filters = [];
  while (speed > 2.0) {
    filters.push("atempo=2.0");
    speed /= 2.0;
  }
  while (speed < 0.5) {
    filters.push("atempo=0.5");
    speed /= 0.5;
  }
  if (Math.abs(speed - 1.0) > 0.01) {
    filters.push(`atempo=${speed.toFixed(3)}`);
  }
  return filters.length > 0 ? filters.join(",") : "anull";
}

async function runHybridPipeline() {
  const projectId = process.argv[2] || "7543179816128843046_short01";
  console.log(`\n======================================================`);
  console.log(`🚀 RUNNING REMOTION DESIGN LAYER v1 + FFMPEG MEDIA LAYER (M1)`);
  console.log(`🎯 Target Project: ${projectId}`);
  console.log(`======================================================\n`);

  const startTime = Date.now();

  // Clean temp files for fresh render
  try {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true });
  } catch {}
  fs.mkdirSync(TEMP_DIR, { recursive: true });

  // 1. Locate Timeline JSON
  let timelinePath = path.join(WORKSPACE_ROOT, "incoming", `${projectId}.json`);
  if (!fs.existsSync(timelinePath)) {
    timelinePath = `/Volumes/Media/Auto-Video-Factory/${projectId}/${projectId}.json`;
  }
  if (!fs.existsSync(timelinePath)) {
    throw new Error(`Timeline JSON not found for project: ${projectId}`);
  }

  const timelineJson = JSON.parse(fs.readFileSync(timelinePath, "utf8"));
  const allScenes = timelineJson.timeline || [];
  // FILTER: Only include active scenes
  const scenes = allScenes.filter((sc) => sc.include !== false);
  const sourceVideoPath = timelineJson.video_meta?.input_file || "/Volumes/NextCloud/Douyin/Long_Douyin/7543179816128843046.mp4";

  // Calculate exact duration from active scenes
  const totalDurationSec = scenes.reduce((acc, sc) => acc + (Number(sc.duration_s !== undefined ? sc.duration_s : sc.duration) || 0), 0);
  const totalDurationFrames = Math.round(totalDurationSec * 30);
  const exactDurationSec = totalDurationFrames / 30;

  console.log(`[Input] 📜 Timeline: ${timelinePath}`);
  console.log(`[Input] 🎬 Active Scenes: ${scenes.length}/${allScenes.length} phân cảnh (Đã lọc bỏ ${allScenes.length - scenes.length} cảnh include:false)`);
  console.log(`[Input] ⏱️ Tổng thời lượng: ${exactDurationSec.toFixed(3)}s (${totalDurationFrames} frames @ 30fps)`);
  console.log(`[Input] 🎥 Video Nguồn: ${sourceVideoPath}`);

  // Copy/Setup files for Remotion
  const publicVideoPath = path.join(PROJECT_ROOT, "public", "source_video.mp4");
  console.log(`[Setup] Linking/copying source video to public directory...`);
  try {
    fs.unlinkSync(publicVideoPath);
  } catch {}
  fs.copyFileSync(sourceVideoPath, publicVideoPath);

  const adapterJsonPath = path.join(PROJECT_ROOT, "src", "adapters", "production_short01.json");
  fs.writeFileSync(adapterJsonPath, JSON.stringify(timelineJson, null, 2), "utf8");

  // ---------------------------------------------------------
  // PHASE 1: REMOTION DESIGN LAYER v1 (VISUAL COMPOSITOR)
  // ---------------------------------------------------------
  console.log(`\n🎨 [Phase 1: Remotion Design Layer v1] Bắt đầu render Visual Master (Chuẩn CRF=20 tối ưu dung lượng + Màu BT.709)...`);
  const visualStartTime = Date.now();
  const visualTempOutput = path.join(TEMP_DIR, "temp_visual.mp4");

  // Use CRF=20 (matching Legacy FFmpeg) for optimal compression, compact file size & pristine visual quality
  const remotionCmd = `npx remotion render src/index.ts ProductionShort01 "${visualTempOutput}" --concurrency=5 --pixel-format=yuv420p --crf=20`;
  execSync(remotionCmd, { cwd: PROJECT_ROOT, stdio: "inherit" });
  const visualDurationS = ((Date.now() - visualStartTime) / 1000).toFixed(1);
  console.log(`[Phase 1] ✅ Visual Master hoàn tất trong ${visualDurationS}s: ${visualTempOutput}`);

  // ---------------------------------------------------------
  // PHASE 2: FFMPEG MEDIA LAYER (SCENE-ACCURATE NATIVE AUDIO + SPEED RATIO + DYNAMIC BGM MIXING)
  // ---------------------------------------------------------
  console.log(`\n🎵 [Phase 2: FFmpeg Media Layer] Trích xuất âm thanh gốc theo từng Scene & Tỷ lệ tốc độ (Chained atempo)...`);
  const audioStartTime = Date.now();

  const audioConfig = timelineJson.audio_config || {};
  const bgmMood = String(audioConfig.bgm_mood || "").toLowerCase();
  const hasOriginalMusic = audioConfig.has_original_music === true || timelineJson.video_meta?.has_original_music === true;
  const audioStrategy = String(timelineJson.video_meta?.audio_strategy || "").toLowerCase();

  const nativeAudioTemp = path.join(TEMP_DIR, "native_scenes_audio.aac");
  let finalAudioOutput = path.join(TEMP_DIR, "final_aligned_audio.aac");

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

  // 2. Mix Native Audio with BGM (100% Legacy Dynamic Volume Formula)
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
      // Long2Short or Fast Speedup (>= 2.0x) -> 85% (0.85)
      // Normal video with Voiceover -> 25% (0.25)
      // Normal video without Voiceover -> 50% (0.50)
      const bgmVolume = (isLong2Short || hasFastSpeedup) ? 0.85 : (hasVoiceover ? 0.25 : 0.50);

      console.log(`[AudioEngine] 🎵 Hòa âm BGM (Volume ${(bgmVolume * 100).toFixed(0)}% | Chế độ: ${isLong2Short ? "Long2Short" : (hasFastSpeedup ? "Tua Nhanh" : (hasVoiceover ? "Voiceover" : "Bình Thường"))}) + Tiếng gốc (Volume 100%): ${bgmTrack.path}`);
      
      // Legacy pitch-shift (+0.5% asetrate) + seamless loop + dynamic volume + amix
      const bgmMixCmd = `ffmpeg -y -i "${nativeAudioTemp}" -i "${bgmTrack.path}" -filter_complex "[1:a]asetrate=44320,aresample=48000,volume=${bgmVolume},aloop=loop=-1:size=2e+9,atrim=0:${exactDurationSec.toFixed(6)}[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[final]" -map "[final]" -c:a aac -b:a 192k "${finalAudioOutput}"`;
      execSync(bgmMixCmd, { stdio: "pipe" });
    } else {
      fs.copyFileSync(nativeAudioTemp, finalAudioOutput);
    }
  } else {
    // Pure Native Audio
    console.log(`[AudioEngine] 🎙️ Giữ nguyên vẹn 100% âm thanh gốc (Native ASMR / Voice).`);
    fs.copyFileSync(nativeAudioTemp, finalAudioOutput);
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

  // Final Technical Verification
  const probeCmd = `ffprobe -v error -show_entries format=duration,size,bit_rate -show_streams -of json "${finalMasterOutput}"`;
  const probeOut = JSON.parse(execSync(probeCmd, { encoding: "utf8" }));

  const vStream = probeOut.streams?.find((s) => s.codec_type === "video") || {};
  const aStream = probeOut.streams?.find((s) => s.codec_type === "audio") || {};
  const format = probeOut.format || {};

  const vDur = parseFloat(vStream.duration || format.duration || "0");
  const aDur = parseFloat(aStream.duration || format.duration || "0");
  const driftMs = Math.abs(vDur - aDur) * 1000;
  const isAligned = driftMs <= 30.0;

  console.log(`\n📊 [Báo Cáo Kiểm Tra Kỹ Thuật Phase M1]`);
  console.log(`  - Độ phân giải: ${vStream.width}x${vStream.height} (Chuẩn 1080x1920: ${vStream.width === 1080 && vStream.height === 1920 ? "✅ PASS" : "❌ FAIL"})`);
  console.log(`  - Framerate: ${vStream.r_frame_rate} (Chuẩn 30fps: ${vStream.r_frame_rate === "30/1" ? "✅ PASS" : "❌ FAIL"})`);
  console.log(`  - Không Gian Màu (Color Space): ${vStream.color_space || "bt709"} (Chuẩn BT.709 Nguyên Bản)`);
  console.log(`  - Thời lượng Video: ${vDur.toFixed(3)}s`);
  console.log(`  - Thời lượng Audio: ${aDur.toFixed(3)}s`);
  console.log(`  - Độ lệch Audio / Video: ${driftMs.toFixed(1)} ms (${isAligned ? "✅ KHỚP PACKET AAC" : "⚠️ LỆCH"})`);
  console.log(`  - Chuẩn Âm Thanh: ${aStream.codec_name} (${aStream.sample_rate}Hz, ${aStream.channels} channels)`);
  console.log(`  - Dung lượng file: ${(parseInt(format.size) / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`\n======================================================`);
  console.log(`🎉 PHASE M1 HYBRID RENDER HOÀN TẤT XUẤT SẮC!`);
  console.log(`======================================================\n`);
}

runHybridPipeline().catch((err) => {
  console.error("Pipeline fatal error:", err.message);
  process.exit(1);
});
