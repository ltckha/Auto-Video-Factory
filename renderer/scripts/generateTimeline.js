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
const HEAVY_MODELS = (modelsConfig.models && modelsConfig.models.heavy_video_analysis) || ["gemini-3.6-flash", "gemini-3.7-flash", "gemini-3.5-flash", "gemini-3.0-flash", "gemini-2.5-flash"];
const LITE_MODELS = (modelsConfig.models && modelsConfig.models.lightweight_tasks) || ["gemini-3.5-flash-lite", "gemini-3.1-flash-lite", "gemini-3.6-flash", "gemini-3.7-flash"];

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
        }
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
          subtitle_style: { type: "STRING" },
          text_position: { type: "STRING", enum: ["top", "center", "bottom"] },
          voice: { type: "STRING" },
          visual_cue: { type: "STRING" },
          text_effect: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING", enum: ["Pop-up", "Bounce", "Typewriter", "Slide In", "Glow"] },
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

  const apiKey = process.env.GEMINI_API_KEY;
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

    // Nhận diện Ngách Nội Dung & Nạp Master Preset nếu đạt độ tin cậy >= 0.7
    let activePresetContext = "";
    try {
      console.log("[NicheDetect] Đang nhận diện ngách nội dung & nhịp độ video gốc...");
      const nicheResponse = await generateContentWithRetryFallback(
        ai,
        LITE_MODELS,
        [
          {
            fileData: {
              fileUri: fileState.uri,
              mimeType: fileState.mimeType,
            },
          },
          "Phân tích ngắn gọn video và trả về JSON chứa category (ngách nội dung: tech_unboxing, asmr_build, affiliate_sales, fashion_lifestyle, food_cooking, diy_home, general_viral), pacing (fast_impact hoặc cinematic_slow) và niche_confidence (số thực từ 0.0 đến 1.0).",
        ],
        {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              category: { type: "STRING" },
              pacing: { type: "STRING" },
              niche_confidence: { type: "NUMBER" },
            },
            required: ["category", "pacing", "niche_confidence"],
          },
        }
      );

      const nicheData = JSON.parse(nicheResponse.text || "{}");
      const category = (nicheData.category || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase().trim();
      const confidence = Number(nicheData.niche_confidence) || 0;

      if (category && confidence >= 0.7) {
        const presetPath = path.join(ROOT, "effects", "presets", `preset_${category}.json`);
        if (fs.existsSync(presetPath)) {
          console.log(`[NicheDetect] Đã chọn Master Preset: ${category} (Độ tin cậy: ${confidence})`);
          const presetContent = fs.readFileSync(presetPath, "utf8");
          activePresetContext = `\n\n━━━━━━━━━━━━━━━━━━\nMASTER NICHE FEW-SHOT PRESET (${category.toUpperCase()})\n━━━━━━━━━━━━━━━━━━\nHãy tham khảo cấu trúc nhịp độ, vị trí chữ và hiệu ứng từ Preset Ngách dưới đây khi sinh timeline:\n${presetContent}\n`;
        }
      }
    } catch (nicheErr) {
      console.warn(`[NicheDetect] WARN: Lỗi nhận diện ngách (${nicheErr.message}) — dùng prompt chuẩn, không nạp preset`);
    }

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
        const chosenIdea = await selectCreativeIdea(ideationData.ideas);
        if (chosenIdea && chosenIdea.creative_prompt_directive) {
          chosenIdeaDirective = `\n\n━━━━━━━━━━━━━━━━━━\n🎯 ĐỊNH HƯỚNG Ý TƯỞNG ĐÃ ĐƯỢC NGƯỜI DÙNG LỰA CHỌN:\n- Tên Góc Ý Tưởng: ${chosenIdea.angle_name}\n- Chỉ Đạo Đạo Diễn: ${chosenIdea.creative_prompt_directive}\n━━━━━━━━━━━━━━━━━━\nHãy bám sát $100\%$ định hướng ý tưởng này khi chọn mốc thời gian, viết subtitle và dựng phân cảnh!`;

          // ⚡ LOCAL STYLE RETRIEVER: Match against learned_styles
          const queryText = [
            chosenIdea.angle_name || "",
            chosenIdea.hook_summary || "",
            chosenIdea.style_direction || "",
            chosenIdea.creative_prompt_directive || "",
            path.basename(filePath)
          ].join(" ");

          const matchedStyle = findBestMatchingStyle(queryText);
          if (matchedStyle && matchedStyle.profile) {
            console.log(`\n[StyleRetriever] 🎯 Bắt trúng Style Recipe mẫu: "${matchedStyle.name}" (Độ khớp: ${(matchedStyle.score * 100).toFixed(1)}%)`);
            console.log(`[StyleRetriever] 💡 ${matchedStyle.reason}`);

            chosenIdeaDirective += `\n\n━━━━━━━━━━━━━━━━━━\n🎨 CÔNG THỨC DỰNG ĐÃ HỌC TỪ VIRAL VIDEO (LEARNED STYLE RECIPE):\n- Phong Cách Mẫu: ${matchedStyle.name} ("${matchedStyle.id}")\n- Thời lượng trung bình mỗi phân cảnh: ${matchedStyle.profile.average_scene_duration_s || 4}s\n- Nhịp độ cắt (Pacing): ${matchedStyle.profile.pacing_speed || "medium"}\n- Chuyển động camera ưu tiên: ${matchedStyle.profile.recommended_camera_motion || "macro_push"}\n${matchedStyle.profile.motion_graph ? `- Đồ thị chuyển động: ${matchedStyle.profile.motion_graph}\n` : ""}${matchedStyle.profile.hook_strategy ? `- Chiến lược Hook: ${matchedStyle.profile.hook_strategy}\n` : ""}- Hãy gán trường "style" trong video_meta là "${matchedStyle.id}" và áp dụng các thông số trên vào từng phân cảnh!`;
          } else {
            console.log("\n[StyleRetriever] ℹ️ Chủ đề độc lập, áp dụng phong cách tự do của đạo diễn.");
          }
        }
      }
    } catch (ideationErr) {
      console.warn(`[Ideation] Warning: Bỏ qua bước chọn ý tưởng do gặp lỗi: ${ideationErr.message}. Tiếp tục quy trình chuẩn...`);
    }

    console.log(`[AI] [VideoEngine] 🧠 Đang gửi yêu cầu phân tích video & sinh Timeline JSON (mode: ${videoProcessingMode}) sang Gemini AI...`);
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
        systemInstruction: systemInstruction + activePresetContext + chosenIdeaDirective,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Không nhận được dữ liệu phản hồi từ mô hình.");
    }

    // Kiểm tra và parse JSON
    let timelineJson;
    try {
      timelineJson = JSON.parse(responseText);
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
