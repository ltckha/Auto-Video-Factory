#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const { getLocalDateTime, syncProjectToSheet, syncScenesToSheet } = require("./googleSheetsSync");
const { selectCreativeIdea } = require("./interactiveIdeationReview");
const { findBestMatchingStyle } = require("./styleRetriever");

const ROOT = path.resolve(__dirname, "..", "..");
const INCOMING_DIR = path.join(ROOT, "incoming");
const PROMPTS_DIR = path.join(ROOT, "renderer", "prompts");
const PROMPT_PATH = path.join(PROMPTS_DIR, "timeline_generator_prompt.md");

const ENUMS_PATH = path.join(ROOT, "renderer", "config", "effectEnums.json");
const effectEnums = fs.existsSync(ENUMS_PATH) ? JSON.parse(fs.readFileSync(ENUMS_PATH, "utf8")) : {};

const MODELS_CONFIG_PATH = path.join(ROOT, "renderer", "config", "geminiModelsConfig.json");
const modelsConfig = fs.existsSync(MODELS_CONFIG_PATH) ? JSON.parse(fs.readFileSync(MODELS_CONFIG_PATH, "utf8")) : {};
const HEAVY_MODELS = (modelsConfig.models && modelsConfig.models.heavy_video_analysis) || ["gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-2.5-flash"];
const LITE_MODELS = (modelsConfig.models && modelsConfig.models.lightweight_tasks) || ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-3.6-flash", "gemini-3.7-flash"];

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    video_meta: {
      type: "OBJECT",
      properties: {
        title: { type: "STRING" },
        description: { type: "STRING" },
        hashtags: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        brand: {
          type: "STRING",
          enum: [
            "hieu_giay_hai_nancy",
            "yen_handmade_leather",
            "mua_chuan_xai_lau",
            "yenyen_deals",
            "macadamia_hai_nancy",
            "o_da_lat_vay_thoi",
            "elegant_steps",
            "yenyen_farm",
            "yenyen_forest_farm",
            "general"
          ]
        },
        brand_name: { type: "STRING" },
        style: { type: "STRING" }
      },
      required: ["title", "description", "hashtags"]
    },
    audio_config: {
      type: "OBJECT",
      properties: {
        bgm_mood: { type: "STRING", enum: ["energetic", "luxury", "chill", "satisfying", "none"] },
        bgm_url: { type: "STRING" },
        enable_sfx: { type: "BOOLEAN" }
      }
    },
    timeline: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          scene_id: { type: "STRING" },
          scene_type: { type: "STRING", enum: ["hook", "body", "transition", "conclusion"] },
          start_s: { type: "NUMBER" },
          end_s: { type: "NUMBER" },
          duration_s: { type: "NUMBER" },
          title: { type: "STRING" },
          story_importance: { type: "NUMBER" },
          key_moments: {
            type: "ARRAY",
            items: { type: "NUMBER" }
          },
          speed_strategy: { type: "STRING", enum: ["uniform", "adaptive", "ramp", "jumpcut"] },
          render_priority: { type: "STRING", enum: ["keep", "compress"] },
          subtitle: { type: "STRING" },
          subtitle_style: { type: "STRING", enum: effectEnums.subtitle_style || [] },
          text_position: { type: "STRING", enum: ["top", "center", "bottom"] },
          voice: { type: "STRING" },
          visual_cue: { type: "STRING" },
          visual_description: { type: "STRING" },
          visual_intent: { type: "STRING" },
          rhythm_intent: { type: "STRING", enum: ["REST", "BUILD", "ACCELERATE", "HIT", "RELEASE", "FLOW"] },
          layout: { type: "STRING", enum: ["full", "split", "split_vertical", "split_horizontal"] },
          impact_effect: { type: "STRING" },
          text_effect: {
            type: "OBJECT",
            properties: {
              name: {
                type: "STRING",
                enum: [
                  "word_pop",
                  "masked_slide",
                  "tracking_expand",
                  "typewriter",
                  "outlined_punch",
                  "rotated_sticker_pop",
                  "smooth_blur_reveal",
                  "stomp_zoom",
                  "Pop-up",
                  "Bounce",
                  "Slide In",
                  "Glow"
                ]
              },
              description: { type: "STRING" }
            },
            required: ["name", "description"]
          },
          advanced_effect: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              intent: { type: "STRING", enum: effectEnums.intent || [] },
              mood: { type: "STRING", enum: effectEnums.mood || [] },
              pacing: { type: "STRING", enum: effectEnums.pacing || [] },
              focus: { type: "STRING", enum: effectEnums.focus || [] },
              camera_motion: { type: "STRING", enum: effectEnums.camera_motion || [] },
              intensity: { type: "NUMBER" },
              description: { type: "STRING" }
            },
            required: ["name", "intent", "mood", "pacing", "focus", "camera_motion", "intensity", "description"]
          },
          transition_out: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: effectEnums.transition_type || [] },
              duration: { type: "NUMBER" }
            },
            required: ["type", "duration"]
          },
          hook_strength: { type: "NUMBER" },
          visual_energy: { type: "NUMBER" },
          retention_score: { type: "NUMBER" },
          confidence: { type: "NUMBER" },
          include: { type: "BOOLEAN" }
        },
        required: [
          "scene_id", "scene_type", "start_s", "end_s", "duration_s", "title",
          "story_importance", "key_moments", "speed_strategy", "render_priority",
          "subtitle", "subtitle_style", "text_position", "voice", "visual_cue",
          "text_effect", "advanced_effect", "hook_strength", "visual_energy",
          "retention_score", "confidence", "include"
        ]
      }
    }
  },
  required: ["video_meta", "timeline"]
};

function generateTimestampId() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
}

async function generateContentWithRetryFallback(ai, models, contents, config) {
  let lastError;

  for (const modelName of models) {
    console.log(`[AI] Đang thử sử dụng mô hình '${modelName}'...`);

    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents,
        config,
      });

      if (response && response.text) {
        console.log(`[AI] ✅ Mô hình '${modelName}' đã sinh dữ liệu thành công!`);
        return response;
      }
    } catch (err) {
      lastError = err;
      const isUnavailable =
        err.message &&
        (err.message.includes("503") ||
          err.message.includes("UNAVAILABLE") ||
          err.message.includes("high demand") ||
          err.message.includes("429"));

      if (isUnavailable) {
        console.warn(`[AI] ⚠️ Mô hình '${modelName}' bị báo quá tải (503/429). Chuyển sang mô hình dự phòng kế tiếp...`);
      } else {
        console.warn(`[AI] ⚠️ Mô hình '${modelName}' gặp lỗi: ${err.message}. Thử mô hình kế tiếp...`);
      }
    }
  }

  throw lastError || new Error("Tất cả các mô hình Gemini trong danh sách đều quá tải hoặc thất bại.");
}


function validateAndFixTimelineTimestamps(timelineJson, videoPath) {
  if (!timelineJson || !Array.isArray(timelineJson.timeline)) return timelineJson;

  let videoDuration = 0;
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const out = require("child_process").execSync(cmd, { encoding: "utf8" }).trim();
    videoDuration = parseFloat(out) || 0;
  } catch {}

  if (videoDuration <= 0) return timelineJson;

  let fixedCount = 0;
  const scenes = timelineJson.timeline;

  function tryConvertMSS(val, minExpected, maxExpected) {
    if (val >= 100) {
      const min = Math.floor(val / 100);
      const sec = val % 100;
      if (sec < 60) {
        const converted = min * 60 + sec;
        if (converted >= minExpected - 0.5 && converted <= maxExpected + 1) {
          return { converted, min, sec };
        }
      }
    }
    return null;
  }

  let prevEnd = 0;
  for (let i = 0; i < scenes.length; i++) {
    const s = scenes[i];
    let start = Number(s.start_s ?? s.start) || 0;
    let end = Number(s.end_s ?? s.end) || 0;

    // 1. Kiểm tra chuyển đổi start mốc M:SS -> MSS (Ví dụ 1:13 -> 113 -> 73s)
    const mssStart = tryConvertMSS(start, prevEnd, videoDuration);
    if (mssStart && (start >= videoDuration || start > prevEnd + 25)) {
      console.log(
        `[AutoCorrect] ⚠️ Phát hiện AI nhầm mốc thời gian M:SS (${mssStart.min}:${mssStart.sec < 10 ? "0" + mssStart.sec : mssStart.sec}). Tự động chuyển start_s từ ${start}s -> ${mssStart.converted}s`
      );
      start = mssStart.converted;
      fixedCount++;
    }

    // 2. Kiểm tra chuyển đổi end mốc M:SS -> MSS (Ví dụ 1:13 -> 113 -> 73s)
    const mssEnd = tryConvertMSS(end, start, videoDuration);
    if (mssEnd && (end >= videoDuration || end > start + 25)) {
      console.log(
        `[AutoCorrect] ⚠️ Phát hiện AI nhầm mốc thời gian M:SS (${mssEnd.min}:${mssEnd.sec < 10 ? "0" + mssEnd.sec : mssEnd.sec}). Tự động chuyển end_s từ ${end}s -> ${mssEnd.converted}s`
      );
      end = mssEnd.converted;
      fixedCount++;
    }

    // 3. Clamp an toàn đảm bảo start < end và không vượt quá độ dài video gốc
    if (end > videoDuration) {
      end = videoDuration;
      fixedCount++;
    }

    if (start >= end) {
      const fallbackDuration = Number(s.duration_s) || 5;
      start = Math.max(0, Math.min(start, Math.max(0, videoDuration - fallbackDuration)));
      end = Math.min(videoDuration, start + fallbackDuration);
      console.log(`[AutoCorrect] ⚠️ Hiệu chỉnh mốc thời gian vỡ (start >= end): scene=${s.scene_id} -> start=${start}s, end=${end}s`);
      fixedCount++;
    }

    s.start_s = Number(start.toFixed(2));
    s.end_s = Number(end.toFixed(2));
    prevEnd = s.end_s;
  }

  if (fixedCount > 0) {
    console.log(`[AutoCorrect] ✅ Đã tự động hiệu chỉnh an toàn ${fixedCount} mốc thời gian trong kịch bản JSON!`);
  }

  return timelineJson;
}

async function main() {
  const { resolveMultiInputs, getVideoDuration } = require("./multiInputResolver");
  const { generateSmartProxy1x } = require("./smartProxyGenerator");

  const nonFlagArgs = process.argv.slice(2).filter((arg) => !arg.startsWith("--"));
  if (nonFlagArgs.length === 0) {
    console.error("Lỗi: Vui lòng truyền đường dẫn video gốc.");
    process.exit(1);
  }

  const TEMP_WORK_DIR = path.join(INCOMING_DIR, "temp_concat");
  let inputRes;
  try {
    inputRes = resolveMultiInputs(nonFlagArgs, TEMP_WORK_DIR);
  } catch (resErr) {
    console.error("Lỗi xử lý đầu vào video:", resErr.message);
    process.exit(1);
  }

  const absoluteVideoPath = inputRes.masterVideoPath;
  const dur = inputRes.totalDuration;

  const defaultProjectId = inputRes.suggestedProjectId || path.basename(absoluteVideoPath, path.extname(absoluteVideoPath));
  const projectId = defaultProjectId;

  // Phân tích tham số mode trước khi upload: node generateTimeline.js <path> [--mode=short2short|long2short|long_highlight_clusters]
  let mode = null;
  const modeArg = process.argv.find((arg) => arg.startsWith("--mode="));
  if (modeArg) {
    mode = modeArg.split("=")[1].toLowerCase().trim();
  }

  // Tự động nhận diện Mode dựa trên Ma trận 5 Tầng thời lượng nếu không truyền cờ --mode
  if (!mode) {
    if (dur < 60) {
      mode = "short2short";
    } else if (dur >= 60 && dur <= 90) {
      console.log(`\n[ModeSelect] 🔀 Video dài ${dur.toFixed(1)}s (Vùng 60s-90s linh hoạt). Mặc định chọn 'short2short'. (Dùng --mode=long2short để đổi).`);
      mode = "short2short";
    } else if (dur > 90 && dur <= 180) {
      mode = "long2short";
    } else if (dur > 180 && dur <= 300) {
      console.log(`\n[ModeSelect] 🖐️ Video dài ${dur.toFixed(1)}s (Vùng 3m-5m linh hoạt). Mặc định chọn 'long2short'. (Dùng --mode=long_highlight_clusters để sinh chùm shorts MỚI).`);
      mode = "long2short";
    } else {
      console.log(`\n[ModeSelect] 🔥 Video dài ${dur.toFixed(1)}s (> 5 phút). Tự động chọn Mode MỚI 'long_highlight_clusters' (Chùm Video Ngắn Batch)!`);
      mode = "long_highlight_clusters";
    }
  }

  const isShort2Short = mode === "short2short";
  const isClusterMode = mode === "long_highlight_clusters" || mode === "clusters";
  const pipelineMode = isClusterMode ? "LongHighlightClusters" : (isShort2Short ? "Short2Short" : "Long2Short");
  const promptFileName = isClusterMode
    ? "long_highlight_cluster_prompt.md"
    : (isShort2Short ? "short2short_generator_prompt.md" : "long2short_generator_prompt.md");
  const promptPath = path.join(PROMPTS_DIR, promptFileName);

  console.log(`[Mode] Chế độ chạy: ${pipelineMode} (Prompt: ${promptFileName}, Độ dài gốc: ${dur.toFixed(1)}s)`);

  if (!fs.existsSync(promptPath)) {
    throw new Error(`Không tìm thấy file prompt system tại: ${promptPath}`);
  }
  let systemInstruction = fs.readFileSync(promptPath, "utf8");

  // Đo dung lượng video gốc
  let fileSizeMB = 0;
  try {
    const fileStats = fs.statSync(absoluteVideoPath);
    fileSizeMB = fileStats.size / (1024 * 1024);
  } catch (statErr) {
    // Không block nếu lỗi đọc dung lượng
  }

  console.log(`[VideoProfile] 📹 Độ dài: ${dur.toFixed(1)}s | Dung lượng: ${fileSizeMB.toFixed(1)} MB`);

  // Nếu là Mode Cluster / Video Dài (> 5m) / Dung Lượng Lớn (> 200MB) -> Tạo Smart Proxy 1x 720p siêu nhẹ (giữ 100% âm thanh & mốc giây)
  let fileToUpload = absoluteVideoPath;
  const shouldCreateProxy = isClusterMode || dur > 300 || fileSizeMB > 200;
  if (shouldCreateProxy) {
    const reason = isClusterMode
      ? "Chế độ Chùm Shorts"
      : dur > 300
      ? `Thời lượng dài (${dur.toFixed(1)}s > 5m)`
      : `Dung lượng lớn (${fileSizeMB.toFixed(1)}MB > 200MB)`;
    console.log(`[SmartProxy] ⚡ Tự động tạo Smart Proxy 1x 720p siêu nhẹ do: ${reason}...`);
    fileToUpload = generateSmartProxy1x(absoluteVideoPath, TEMP_WORK_DIR);
  }

  // LỰA CHỌN CHẾ ĐỘ XỬ LÝ (DYNAMIC PROCESSING SELECTOR THEO CHUẨN GOOGLE):
  // - Video Dài (> 5 phút / Mode Cluster) -> Dùng 'agentic' để tua nhanh, tiết kiệm 88% token và quét động
  // - Video Ngắn (< 5 phút / Short2Short / Long2Short) -> Dùng 'static' để quét frame-level tức thì và độ trễ thấp
  const videoProcessingMode = (dur > 300 || isClusterMode) ? "agentic" : "static";
  console.log(`[VideoProcessing] ⚙️ Chế độ xử lý video: '${videoProcessingMode}' (${dur > 300 || isClusterMode ? "Video dài / Cluster -> 'agentic' Dynamic Scan" : "Video ngắn < 5m -> 'static' Frame-level Precision"})`);

  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    try {
      const home = process.env.HOME || require("os").homedir();
      for (const rc of [".zshrc", ".bash_profile", ".bashrc"]) {
        const rcPath = path.join(home, rc);
        if (fs.existsSync(rcPath)) {
          const content = fs.readFileSync(rcPath, "utf8");
          const match = content.match(/export\s+GEMINI_API_KEY=["']?([^"'\r\n]+)["']?/);
          if (match && match[1]) {
            apiKey = match[1].trim();
            process.env.GEMINI_API_KEY = apiKey;
            break;
          }
        }
      }
    } catch {}
  }
  if (!apiKey) {
    console.error("Lỗi: Chưa thiết lập biến môi trường GEMINI_API_KEY.");
    process.exit(1);
  }

  console.log(`[Project] Khởi tạo dự án: ${projectId}`);
  const ai = new GoogleGenAI({ apiKey });

  let uploadResult;
  try {
    console.log(`[Upload] Đang upload video lên Gemini File API: ${fileToUpload}...`);
    uploadResult = await ai.files.upload({
      file: fileToUpload,
      mimeType: "video/mp4",
    });
    console.log(`[Upload] Đã tải lên file: ${uploadResult.name} (URI: ${uploadResult.uri})`);
  } catch (uploadErr) {
    console.error("Lỗi: Không thể upload video lên File API:", uploadErr.message);
    process.exit(1);
  }

  try {
    console.log("[Poll] Đang đợi Gemini xử lý video...");
    let fileState = uploadResult;
    let attempts = 0;
    while (fileState.state === "PROCESSING") {
      attempts++;
      console.log(`[Poll] (#${attempts}) File đang được xử lý, đợi 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      fileState = await ai.files.get({ name: uploadResult.name });
    }

    if (fileState.state !== "ACTIVE") {
      throw new Error(`Xử lý file thất bại. Trạng thái file: ${fileState.state}`);
    }
    console.log("[Poll] Video đã sẵn sàng hoạt động!");

    if (isClusterMode) {
      // XỬ LÝ MODE CLUSTER (PASS 1 & PASS 2 DÀNH CHO VIDEO DÀI/BATCH SHORTS)
      console.log(`[AI] [VideoEngine] 🧠 Đang gửi yêu cầu phân tích & trích xuất chùm Video Ngắn (mode: ${videoProcessingMode}) sang Gemini AI...`);
      const clusterResponse = await generateContentWithRetryFallback(
        ai,
        HEAVY_MODELS,
        [
          {
            fileData: {
              fileUri: fileState.uri,
              mimeType: fileState.mimeType,
            },
            processing: videoProcessingMode,
          },
          "Hãy phân tích toàn bộ video theo cơ chế Agentic Video Understanding (định vị mốc thời gian chuẩn xác mili-giây và phân tích động), trích xuất tất cả các đoạn Video Ngắn Độc Lập giá trị nhất (mỗi video 30s-55s, tốc độ 1.0x chuẩn tự nhiên) kèm đầy đủ kịch bản phân cảnh và bài viết Social Post.",
        ],
        {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
        }
      );

      const rawData = JSON.parse(clusterResponse.text || "{}");
      let shorts = rawData.shorts || rawData.clusters || [];
      console.log(`[DirectHighlightCutter] ✅ Đã phát hiện ${shorts.length} Video Ngắn Độc Lập hoàn chỉnh!`);

      if (shorts.length === 0) {
        console.warn("[DirectHighlightCutter] Cảnh báo: Không tìm thấy video ngắn nào, fallback về mode Long2Short chuẩn.");
      } else {
        // NÂNG CẤP HUMAN-IN-THE-LOOP: Cho phép con người Review, chỉnh mốc thời gian & Tiêu đề/Nội dung
        const { reviewAndEditClusters } = require("./interactiveClusterReview");
        shorts = await reviewAndEditClusters(shorts);

        for (let idx = 0; idx < shorts.length; idx++) {
          const s = shorts[idx];
          const subProjectId = `${projectId}_short${String(idx + 1).padStart(2, "0")}`;
          const title = s.video_meta?.title || s.cluster_title || s.title || `Short #${idx + 1}`;
          console.log(`\n[DirectHighlightCutter] (${idx + 1}/${shorts.length}) Đang tạo kịch bản Timeline JSON: '${subProjectId}' (${title})...`);

          let subTimelineJson = {
            video_meta: s.video_meta || {
              title: title,
              description: s.narrative_focus || "",
              hashtags: s.recommended_hashtags || [],
              audio_strategy: s.audio_strategy || "preserve_native_asmr",
              has_original_music: s.has_original_music !== undefined ? s.has_original_music : true,
            },
            audio_config: s.audio_config || {
              has_original_music: s.has_original_music !== undefined ? s.has_original_music : true,
              bgm_mood: s.audio_strategy === "mix_bgm" ? (s.audio_config?.bgm_mood || "chill") : "none",
              audio_strategy: s.audio_strategy || "preserve_native_asmr"
            },
            timeline: s.timeline || (s.timecodes || []).map((tc, scIdx) => ({
              scene_id: `scene_${String(scIdx + 1).padStart(3, "0")}`,
              scene_type: scIdx === 0 ? "hook" : (scIdx === s.timecodes.length - 1 ? "conclusion" : "body"),
              start_s: tc.start_s !== undefined ? tc.start_s : tc.start,
              end_s: tc.end_s !== undefined ? tc.end_s : tc.end,
              duration_s: (tc.end_s !== undefined ? tc.end_s : tc.end) - (tc.start_s !== undefined ? tc.start_s : tc.start),
              subtitle: tc.description || "",
              subtitle_style: scIdx === 0 ? "vibrant_yellow_sticker" : "minimal_glass_card",
              text_position: "top",
              text_effect: { name: scIdx === 0 ? "Pop-up" : "Slide In" },
              transition_out: scIdx === s.timecodes.length - 1 ? null : { type: "wipe_left", duration: 0.3 }
            }))
          };

          // Đảm bảo duration_s = end_s - start_s (100% tốc độ 1.0x chuẩn tự nhiên, không tua nhanh)
          subTimelineJson.timeline.forEach((sc) => {
            sc.duration_s = Number(((sc.end_s || 0) - (sc.start_s || 0)).toFixed(2));
            if (!sc.speed_strategy) sc.speed_strategy = "uniform";
            if (!sc.render_priority) sc.render_priority = "keep";
          });

          subTimelineJson = validateAndFixTimelineTimestamps(subTimelineJson, absoluteVideoPath);

          const nowCreatedAt = getLocalDateTime();
          subTimelineJson.video_meta.pipeline_mode = "LongHighlightClusters";
          subTimelineJson.video_meta.created_at = nowCreatedAt;
          subTimelineJson.video_meta.input_file = absoluteVideoPath;

          fs.mkdirSync(INCOMING_DIR, { recursive: true });
          const subOutputPath = path.join(INCOMING_DIR, `${subProjectId}.json`);
          fs.writeFileSync(subOutputPath, JSON.stringify(subTimelineJson, null, 2), "utf8");
          console.log(`[Timeline] ✅ Đã sinh thành công file kịch bản độc lập (1.0x Chuẩn): ${subOutputPath}`);

          // Sao chép video nguồn vào incoming cho từng short cụm để sẵn sàng render
          const subVideoPath = path.join(INCOMING_DIR, `${subProjectId}.mp4`);
          fs.copyFileSync(absoluteVideoPath, subVideoPath);
          console.log(`[Video] ✅ Đã sao chép video nguồn sang: ${subVideoPath}`);

          // Đồng bộ thông tin kịch bản từng short sang Google Sheet & Local CSV Backup
          try {
            const videoMeta = subTimelineJson.video_meta || {};
            const scenes = subTimelineJson.timeline || [];
            const shortDur = scenes.reduce((acc, sc) => acc + (Number(sc.duration_s) || 0), 0);
            const effectsUsed = [...new Set(scenes.map((sc) => sc.advanced_effect?.name).filter(Boolean))].join(", ");
            const captionText = `${videoMeta.description || ""} ${(videoMeta.hashtags || []).map((h) => `#${h}`).join(" ")}`.trim();

            let origDurSec = null;
            try {
              const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${absoluteVideoPath}"`;
              const out = require("child_process").execSync(cmd, { encoding: "utf8" }).trim();
              origDurSec = parseFloat(out);
            } catch {}
            const origDurationFormatted = origDurSec && Number.isFinite(origDurSec) ? `${origDurSec.toFixed(1)}s` : "";

            await syncProjectToSheet({
              projectId: subProjectId,
              pipelineMode: "LongHighlightClusters",
              status: "🤖 Timeline Ready",
              inputFile: absoluteVideoPath,
              title: videoMeta.title || title,
              captionHashtags: captionText,
              originalDuration: origDurationFormatted,
              shortDuration: `${shortDur.toFixed(1)}s`,
              sceneCount: scenes.length,
              hookScore: scenes[0]?.hook_strength || "",
              effectsSummary: effectsUsed,
              outputFile: "",
              createdAt: nowCreatedAt,
              renderedAt: "",
            });

            console.log(`[GoogleSheet] ✅ Đã đồng bộ kịch bản '${subProjectId}' sang Google Sheet!`);
          } catch (sheetErr) {
            console.warn(`[GoogleSheet] WARN: Không thể đồng bộ Google Sheet: ${sheetErr.message}`);
          }
        }
        return;
      }
    }

    // -------------------------------------------------------------
    // CHẾ ĐỘ CHUẨN (SHORT2SHORT HOẶC LONG2SHORT): ĐỀ XUẤT 3 GÓC Ý TƯỞNG & CHỌN NHANH
    // -------------------------------------------------------------
    console.log("\n[Ideation] 🧠 Đang phân tích video để đề xuất 3 góc ý tưởng dựng sáng tạo...");

    const ideationSchema = {
      type: "OBJECT",
      properties: {
        ideas: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "NUMBER" },
              angle_name: { type: "STRING" },
              hook_summary: { type: "STRING" },
              style_direction: { type: "STRING" },
              audio_strategy_detail: { type: "STRING" },
              viral_score: { type: "NUMBER" },
              creative_prompt_directive: { type: "STRING" },
              is_recommended: { type: "BOOLEAN" }
            },
            required: ["id", "angle_name", "hook_summary", "style_direction", "audio_strategy_detail", "creative_prompt_directive"]
          }
        }
      },
      required: ["ideas"]
    };

    const ideationPrompt = `Bạn là một Đạo diễn & Chuyên gia Sáng Tạo Nội Dung Video Ngắn Hàng Đầu.
Nhiệm vụ của bạn là xem kỹ toàn bộ video trên và thực hiện 2 BƯỚC ĐỂ ĐỀ XUẤT ĐÚNG 3 GÓC Ý TƯỞNG DỰNG ĐỘC BẢN:

BƯỚC 1: BÓC TÁCH NGỮ CẢNH ĐỘC NHẤT (CONTEXT EXTRACTION)
- Xác định chính xác: Vật thể/Nhân vật/Sản phẩm trung tâm trong video là gì?
- Hành động cốt lõi của con người đang diễn ra trong video là gì?
- Đâu là điểm thị giác hoặc âm thanh kỳ lạ/đắt giá nhất mà CHỈ RIÊNG VIDEO NÀY MỚI CÓ?

BƯỚC 2: SÁNG TẠO 3 GÓC DỰNG ĐỘC BẢN TƯƠNG PHẢN TUYỆT ĐỐI (KHÔNG DÙNG VĂN MẪU RẬP KHUÔN)
Dựa trực tiếp trên vật thể và bối cảnh ở Bước 1, hãy đề xuất 3 góc ý tưởng mang 3 phong cách và mục tiêu truyền thông hoàn toàn khác biệt:
- Ý TƯỞNG 1 (Cảm giác & Xúc giác / Trải nghiệm chân thực): Tập trung trọn vẹn vào độ thỏa mãn của hành động, âm thanh thực tế, vẻ đẹp chi tiết của vật thể.
- Ý TƯỞNG 2 (Kể chuyện / Chia sẻ góc nhìn / Bí quyết nghề): Đặt vấn đề, chia sẻ kiến thức chuyên môn, câu chuyện đằng sau hoặc mẹo thực chiến hữu ích.
- Ý TƯỞNG 3 (Kịch tính / Nhanh gọn / Đánh giá & Kết quả trước-sau): Giật hook mạnh mẽ, nhịp độ dứt khoát, tập trung vào kết quả bất ngờ hoặc tính năng vượt trội.

Yêu cầu từng trường dữ liệu:
- angle_name: Tên ý tưởng độc bản, sắc sảo (gắn liền với tên vật thể/hành động thật trong video) kèm icon.
- hook_summary: 1 câu mở màn giật tít đánh trúng tâm lý người xem trong 3 giây đầu.
- style_direction: Phong cách hình ảnh và đồ họa cụ thể phù hợp với ý tưởng này.
- audio_strategy_detail: Chiến lược âm thanh chi tiết (Giữ 100% âm thanh thực địa, lồng nhạc nền, hoặc xử lý tạp âm).
- viral_score: Điểm tiềm năng thu hút (từ 8.2 đến 9.8).
- creative_prompt_directive: Lời chỉ đạo đạo diễn cụ thể (2-3 câu) để áp dụng vào việc cắt phân cảnh và viết kịch bản chi tiết ở bước sau.`;

    let chosenIdeaDirective = "";
    try {
      const ideationResponse = await generateContentWithRetryFallback(
        ai,
        LITE_MODELS,
        [
          {
            fileData: {
              fileUri: fileState.uri,
              mimeType: fileState.mimeType,
            },
            processing: videoProcessingMode,
          },
          ideationPrompt,
        ],
        {
          responseMimeType: "application/json",
          responseSchema: ideationSchema,
          temperature: 0.85,
        }
      );

      const ideationData = JSON.parse(ideationResponse.text);
      if (ideationData && Array.isArray(ideationData.ideas) && ideationData.ideas.length > 0) {
        // ⚡ ĐỐI CHIẾU STYLE CHO TỪNG Ý TƯỞNG TRƯỚC KHI HIỂN THỊ CHO NGƯỜI DÙNG
        ideationData.ideas.forEach((item) => {
          const queryText = [
            item.angle_name || "",
            item.hook_summary || "",
            item.style_direction || "",
            item.creative_prompt_directive || "",
            path.basename(absoluteVideoPath)
          ].join(" ");
          item.matchedStyle = findBestMatchingStyle(queryText);
        });

        const chosenIdea = await selectCreativeIdea(ideationData.ideas);
        if (chosenIdea && chosenIdea.creative_prompt_directive) {
          chosenIdeaDirective = `\n\n━━━━━━━━━━━━━━━━━━\n🎯 ĐỊNH HƯỚNG Ý TƯỞNG ĐÃ ĐƯỢC NGƯỜI DÙNG LỰA CHỌN:\n- Tên Góc Ý Tưởng: ${chosenIdea.angle_name}\n- Chỉ Đạo Đạo Diễn: ${chosenIdea.creative_prompt_directive}\n━━━━━━━━━━━━━━━━━━\nHãy bám sát $100\%$ định hướng ý tưởng này khi chọn mốc thời gian, viết subtitle và dựng phân cảnh!`;

          const matchedStyle = chosenIdea.matchedStyle;
          if (matchedStyle && matchedStyle.profile) {
            console.log(`[StyleRetriever] 🎯 Áp dụng Style Recipe mẫu: "${matchedStyle.name}" (Độ khớp: ${(matchedStyle.score * 100).toFixed(1)}%)`);
            const p = matchedStyle.profile;
            let recipeLines = [
              `\n\n━━━━━━━━━━━━━━━━━━`,
              `🎨 CÔNG THỨC DỰNG ĐÃ HỌC TỪ VIRAL VIDEO (LEARNED STYLE RECIPE):`,
              `- Phong Cách Mẫu: ${matchedStyle.name} ("${matchedStyle.id}")`,
              `- Thời lượng trung bình mỗi phân cảnh: ${p.average_scene_duration_s || 4}s`,
              `- Nhịp độ cắt (Pacing): ${p.pacing_speed || "medium"}`,
              `- Chuyển động camera ưu tiên: ${p.recommended_camera_motion || "macro_push"}`,
            ];
            if (p.motion_graph) recipeLines.push(`- Đồ thị chuyển động: ${p.motion_graph}`);
            if (p.speed_curve) {
              recipeLines.push(`- Đường cong tốc độ (Speed Curve): Đỉnh ${p.speed_curve.peak_speed}x -> Đáy ${p.speed_curve.trough_speed}x (${p.speed_curve.smooth_algorithm || "smooth"})`);
            }
            if (p.layout) recipeLines.push(`- Bố cục khung hình (Layout): ${p.layout}`);
            if (p.hook_strategy) recipeLines.push(`- Chiến lược Hook: ${p.hook_strategy}`);
            if (p.graphic_text_frame?.frame_type) {
              recipeLines.push(`- Khung đồ họa chữ (Subtitle Frame): ${p.graphic_text_frame.frame_type}`);
            }
            if (p.recommended_transition) {
              recipeLines.push(`- Kỹ xảo chuyển cảnh ưu tiên: ${p.recommended_transition} (${p.transition_duration_s || 0.3}s)`);
            }
            if (p.sfx_strategy) {
              recipeLines.push(`- Kỹ xảo âm thanh (SFX): Chuyển cảnh [${p.sfx_strategy.scene_cut_sfx || "none"}], Cao trào [${p.sfx_strategy.impact_sfx || "none"}]`);
            }
            if (p.color_grading?.mood) {
              recipeLines.push(`- Tông màu điện ảnh (Color Mood): ${p.color_grading.mood}`);
            }
            recipeLines.push(`- Hãy gán trường "style" trong video_meta là "${matchedStyle.id}" và áp dụng các thông số trên vào từng phân cảnh!`);
            chosenIdeaDirective += recipeLines.join("\n");
          } else {
            console.log(`[StyleRetriever] 🎨 Đạo diễn tự do sáng tạo theo ý tưởng đã chọn (Không ép khuôn bài mẫu).`);
          }
        }
      }
    } catch (ideationErr) {
      console.warn(`[Ideation] Warning: Bỏ qua bước chọn ý tưởng do gặp lỗi: ${ideationErr.message}. Tiếp tục quy trình chuẩn...`);
    }

    console.log(`\n[AI] [VideoEngine] 🧠 Đang gửi yêu cầu phân tích video & sinh Timeline JSON (mode: ${videoProcessingMode}) sang Gemini AI...`);
    const response = await generateContentWithRetryFallback(
      ai,
      HEAVY_MODELS,
      [
        {
          fileData: {
            fileUri: fileState.uri,
            mimeType: fileState.mimeType,
          },
          processing: videoProcessingMode,
        },
        "Hãy thực hiện phân tích video trên và trả về kịch bản Timeline JSON chi tiết theo đúng cấu trúc quy chuẩn.",
      ],
      {
        systemInstruction: systemInstruction + chosenIdeaDirective,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Không nhận được dữ liệu phản hồi từ mô hình.");
    }

    let timelineJson;
    try {
      let cleanedText = responseText.trim();
      if (cleanedText.startsWith("```json")) {
        cleanedText = cleanedText.replace(/^```json\s*/i, "").replace(/\s*```$/, "").trim();
      } else if (cleanedText.startsWith("```")) {
        cleanedText = cleanedText.replace(/^```\s*/, "").replace(/\s*```$/, "").trim();
      }

      try {
        timelineJson = JSON.parse(cleanedText);
      } catch (firstErr) {
        console.warn(`[Timeline] ⚠️ JSON.parse lần đầu không thành công (${firstErr.message}), đang kích hoạt bộ lọc sửa lỗi tự động...`);
        // 1. Cắt tỉa các chuỗi lặp bất thường (runaway repetition)
        cleanedText = cleanedText.replace(/("(?:visual_intent|rhythm_intent|title|subtitle)"\s*:\s*")([^"\\]{40,})(")/g, (m, p1, p2, p3) => {
          return `${p1}${p2.substring(0, 30)}${p3}`;
        });

        // 2. Tự động đóng ngoặc kép nếu bị cắt cụt giữa chừng
        const quotes = (cleanedText.match(/(?<!\\)"/g) || []).length;
        if (quotes % 2 !== 0) {
          cleanedText += '"';
        }

        // 3. Tự động đóng các cặp ngoặc nhọn {} và ngoặc vuông [] còn thiếu
        const openBraces = (cleanedText.match(/{/g) || []).length;
        const closeBraces = (cleanedText.match(/}/g) || []).length;
        const openBrackets = (cleanedText.match(/\[/g) || []).length;
        const closeBrackets = (cleanedText.match(/\]/g) || []).length;

        for (let i = 0; i < openBrackets - closeBrackets; i++) cleanedText += "]";
        for (let i = 0; i < openBraces - closeBraces; i++) cleanedText += "}";

        timelineJson = JSON.parse(cleanedText);
        console.log("[Timeline] 🛡️ Đã tự động vá và phục hồi cấu trúc JSON thành công!");
      }
    } catch (jsonErr) {
      console.log("[AI] Dữ liệu thô từ AI:", responseText);
      throw new Error(`Phản hồi không phải là JSON hợp lệ: ${jsonErr.message}`);
    }

    // Tự động kiểm tra và hiệu chỉnh mốc thời gian an toàn
    timelineJson = validateAndFixTimelineTimestamps(timelineJson, absoluteVideoPath);

    // Đảm bảo thư mục incoming tồn tại
    fs.mkdirSync(INCOMING_DIR, { recursive: true });

    // Đo thời lượng video gốc
    let origDurSec = null;
    try {
      const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${absoluteVideoPath}"`;
      const out = require("child_process").execSync(cmd, { encoding: "utf8" }).trim();
      origDurSec = parseFloat(out);
    } catch {}

    // Gán thuộc tính pipeline_mode, original_duration_s, created_at và input_file vào video_meta
    const nowCreatedAt = getLocalDateTime();
    timelineJson.video_meta = timelineJson.video_meta || {};
    timelineJson.video_meta.pipeline_mode = pipelineMode;
    timelineJson.video_meta.created_at = nowCreatedAt;
    timelineJson.video_meta.input_file = absoluteVideoPath;
    if (origDurSec && Number.isFinite(origDurSec)) {
      timelineJson.video_meta.original_duration_s = Number(origDurSec.toFixed(1));
    }

    // Ghi file JSON timeline
    const timelineOutputPath = path.join(INCOMING_DIR, `${projectId}.json`);
    fs.writeFileSync(timelineOutputPath, JSON.stringify(timelineJson, null, 2), "utf8");
    console.log(`[Timeline] Đã tạo file kịch bản JSON: ${timelineOutputPath}`);

    // Sao chép video gốc vào incoming để sẵn sàng render
    const videoOutputPath = path.join(INCOMING_DIR, `${projectId}.mp4`);
    fs.copyFileSync(absoluteVideoPath, videoOutputPath);
    console.log(`[Video] Đã sao chép video gốc sang: ${videoOutputPath}`);

    // Đồng bộ thông tin kịch bản sang Google Sheet & Local CSV Backup
    try {
      const videoMeta = timelineJson.video_meta || {};
      const scenes = timelineJson.timeline || [];
      const shortDur = scenes.reduce((acc, s) => acc + (Number(s.duration_s) || 0), 0);
      const effectsUsed = [...new Set(scenes.map((s) => s.advanced_effect?.name).filter(Boolean))].join(", ");
      const captionText = `${videoMeta.description || ""} ${(videoMeta.hashtags || []).map((h) => `#${h}`).join(" ")}`.trim();

      let origDurSec = null;
      try {
        const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${absoluteVideoPath}"`;
        const out = require("child_process").execSync(cmd, { encoding: "utf8" }).trim();
        origDurSec = parseFloat(out);
      } catch {}
      const origDurationFormatted = origDurSec && Number.isFinite(origDurSec) ? `${origDurSec.toFixed(1)}s` : "";

      await syncProjectToSheet({
        projectId,
        pipelineMode,
        status: "🤖 Timeline Ready",
        inputFile: absoluteVideoPath,
        title: videoMeta.title || "",
        captionHashtags: captionText,
        originalDuration: origDurationFormatted,
        shortDuration: `${shortDur.toFixed(1)}s`,
        sceneCount: scenes.length,
        hookScore: scenes[0]?.hook_strength || "",
        effectsSummary: effectsUsed,
        outputFile: "",
        createdAt: nowCreatedAt,
        renderedAt: "",
      });

      console.log("[GoogleSheet] Đã đồng bộ kịch bản mới sang Google Sheet & CSV Backup thành công!");
    } catch (sheetErr) {
      console.warn(`[GoogleSheet] WARN: Không thể đồng bộ Google Sheet: ${sheetErr.message}`);
    }

    console.log(`\n🎉 Thành công! Dự án '${projectId}' đã sẵn sàng để render.`);
    console.log(`Chạy lệnh: node renderer/scripts/render.js ${projectId}`);

  } catch (err) {
    console.error("\n[Error] Lỗi trong quá trình tạo timeline:", err.message);
    process.exitCode = 1;
  } finally {
    // Luôn dọn dẹp file tạm trên File API để tránh lãng phí dung lượng
    if (uploadResult && uploadResult.name) {
      try {
        console.log(`[Cleanup] Đang xóa file tạm trên Gemini File API (${uploadResult.name})...`);
        await ai.files.delete({ name: uploadResult.name });
        console.log("[Cleanup] Đã dọn dẹp file tạm thành công.");
      } catch (cleanupErr) {
        console.warn(`[Cleanup] Cảnh báo: Không thể xóa file tạm trên File API: ${cleanupErr.message}`);
      }
    }
  }
}

module.exports = { validateAndFixTimelineTimestamps, generateTimeline: main };

if (require.main === module) {
  main().catch((err) => {
    console.error("Unhandled rejection:", err);
    process.exit(1);
  });
}
