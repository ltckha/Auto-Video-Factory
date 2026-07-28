#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const { GoogleGenAI } = require("@google/genai");
const { computeStyleSimilarity, isDuplicateStyle } = require("./effectLearning");

const ROOT = path.resolve(__dirname, "..", "..");
const EFFECTS_DIR = path.join(ROOT, "effects");
const PRESETS_DIR = path.join(EFFECTS_DIR, "presets");
const LEARNED_STYLES_DIR = path.join(EFFECTS_DIR, "learned_styles");
const LEARNED_EFFECTS_PATH = path.join(EFFECTS_DIR, "learned_effects.json");
const ENUMS_PATH = path.join(ROOT, "renderer", "config", "effectEnums.json");
const PROMPT_PATH = path.join(ROOT, "renderer", "prompts", "video_style_learning_prompt.md");

const effectEnums = fs.existsSync(ENUMS_PATH) ? JSON.parse(fs.readFileSync(ENUMS_PATH, "utf8")) : {};

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    style_profile: {
      type: "OBJECT",
      properties: {
        name: { type: "STRING" },
        category_niche: { type: "STRING" },
        average_scene_duration_s: { type: "NUMBER" },
        pacing_speed: { type: "STRING", enum: effectEnums.pacing || ["slow", "medium", "fast", "pulse", "dynamic"] },
        hook_strategy: { type: "STRING" },
        preferred_font_layout: { type: "STRING" },
        transition_rules: {
          type: "ARRAY",
          items: { type: "STRING" },
        },
      },
      required: ["name", "category_niche", "average_scene_duration_s", "pacing_speed"],
    },
    learned_novel_effects: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          effect_name: { type: "STRING" },
          visual_intent: { type: "STRING", enum: effectEnums.intent || [] },
          camera_motion: { type: "STRING", enum: effectEnums.camera_motion || [] },
          recommended_intensity: { type: "NUMBER" },
          description: { type: "STRING" },
        },
        required: ["effect_name", "camera_motion"],
      },
    },
    few_shot_examples: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          scene_type: { type: "STRING", enum: ["hook", "intro", "body", "highlight", "outro", "cta"] },
          duration_range: { type: "STRING" },
          visual_description: { type: "STRING" },
          voice_rhythm: { type: "STRING" },
          suggested_text_effect: { type: "STRING" },
          suggested_subtitle_style: { type: "STRING" },
          suggested_advanced_effect: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              intent: { type: "STRING", enum: effectEnums.intent || [] },
              mood: { type: "STRING", enum: effectEnums.mood || [] },
              pacing: { type: "STRING", enum: effectEnums.pacing || [] },
              focus: { type: "STRING", enum: effectEnums.focus || [] },
              camera_motion: { type: "STRING", enum: effectEnums.camera_motion || [] },
              intensity: { type: "NUMBER" },
            },
            required: ["name", "intent", "camera_motion"],
          },
          suggested_transition_out: {
            type: "OBJECT",
            properties: {
              type: { type: "STRING", enum: effectEnums.transition_type || [] },
              duration: { type: "NUMBER" },
            },
          },
        },
        required: ["scene_type", "suggested_advanced_effect"],
      },
    },
  },
  required: ["style_profile", "few_shot_examples"],
};

function downloadVideoFromUrl(url) {
  const tempDir = path.join(ROOT, "temp", "style_downloads");
  fs.mkdirSync(tempDir, { recursive: true });

  const timestamp = Date.now();
  const outputTemplate = path.join(tempDir, `viral_${timestamp}.mp4`);

  console.log(`[Downloader] Đang tự động tải video từ URL: ${url}...`);
  try {
    let ytdlpBin = "yt-dlp";
    try {
      const found = execSync("which yt-dlp || brew --prefix yt-dlp 2>/dev/null", { encoding: "utf8" }).trim();
      if (found && fs.existsSync(found)) ytdlpBin = found;
    } catch {}

    const cmd = `"${ytdlpBin}" -f "b[ext=mp4]/best[ext=mp4]/best" --no-playlist -o "${outputTemplate}" "${url}"`;
    execSync(cmd, { stdio: "inherit" });

    if (fs.existsSync(outputTemplate)) {
      console.log(`[Downloader] ✅ Tải video thành công: ${outputTemplate}`);
      return { localPath: outputTemplate, isTemp: true };
    }
  } catch (err) {
    throw new Error(`Không thể tải video từ URL với yt-dlp: ${err.message}`);
  }

  throw new Error("Không thể tải video từ URL chỉ định.");
}

async function generateContentWithRetryFallback(ai, models, contents, config) {
  let lastError;
  for (const model of models) {
    try {
      console.log(`[AI] Thử nghiệm mô hình: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents,
        config,
      });
      console.log(`[AI] Mô hình ${model} phản hồi thành công!`);
      return response;
    } catch (err) {
      console.warn(`[AI] Mô hình ${model} gặp lỗi: ${err.message}`);
      lastError = err;
    }
  }
  throw lastError;
}

function sanitizePresetForFewShot(parsedResult) {
  const sanitized = JSON.parse(JSON.stringify(parsedResult));
  if (Array.isArray(sanitized.few_shot_examples)) {
    sanitized.few_shot_examples = sanitized.few_shot_examples.map((s) => {
      delete s.voice;
      delete s.subtitle;
      s.visual_description = `[GENERIC_SCENE_TYPE: ${s.scene_type || "action"}] Dynamic visual action shot matching style profile`;
      return s;
    });
  }
  return sanitized;
}

function updateLearnedEffectsRegistry(novelEffects) {
  if (!Array.isArray(novelEffects) || novelEffects.length === 0) return;
  try {
    fs.mkdirSync(EFFECTS_DIR, { recursive: true });
    let existing = {};
    if (fs.existsSync(LEARNED_EFFECTS_PATH)) {
      try {
        existing = JSON.parse(fs.readFileSync(LEARNED_EFFECTS_PATH, "utf8"));
      } catch {}
    }

    let addedCount = 0;
    for (const eff of novelEffects) {
      if (!eff || !eff.effect_name) continue;
      const key = String(eff.effect_name).toLowerCase().trim();
      const mapped = String(eff.camera_motion || eff.visual_intent || "zoom_soft").toLowerCase().trim();
      if (!existing[key]) {
        existing[key] = mapped;
        addedCount++;
      }
    }

    if (addedCount > 0) {
      fs.writeFileSync(LEARNED_EFFECTS_PATH, JSON.stringify(existing, null, 2) + "\n", "utf8");
      console.log(`[LearnedEffects] Đã tự động cập nhật thêm ${addedCount} hiệu ứng mới vào: ${LEARNED_EFFECTS_PATH}`);
    }
  } catch (err) {
    console.warn(`[LearnedEffects] WARN: Không thể cập nhật learned_effects.json: ${err.message}`);
  }
}

function updateMasterNichePreset(nicheCategory, sanitizedResult) {
  if (!nicheCategory) return;
  try {
    fs.mkdirSync(PRESETS_DIR, { recursive: true });
    const cleanNiche = nicheCategory.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase().trim();
    const presetPath = path.join(PRESETS_DIR, `preset_${cleanNiche}.json`);

    let masterPreset = {
      style_profile: sanitizedResult.style_profile,
      few_shot_examples: [],
    };

    if (fs.existsSync(presetPath)) {
      try {
        masterPreset = JSON.parse(fs.readFileSync(presetPath, "utf8"));
      } catch {}
    }

    masterPreset.style_profile = sanitizedResult.style_profile;
    masterPreset.few_shot_examples = masterPreset.few_shot_examples || [];

    const newExamples = sanitizedResult.few_shot_examples || [];
    for (const newEx of newExamples) {
      let isDuplicate = false;
      for (let i = 0; i < masterPreset.few_shot_examples.length; i++) {
        if (isDuplicateStyle(newEx, masterPreset.few_shot_examples[i], 0.65)) {
          masterPreset.few_shot_examples[i] = newEx;
          isDuplicate = true;
          break;
        }
      }
      if (!isDuplicate) {
        masterPreset.few_shot_examples.push(newEx);
      }
    }

    if (masterPreset.few_shot_examples.length > 5) {
      masterPreset.few_shot_examples = masterPreset.few_shot_examples.slice(-5);
    }

    fs.writeFileSync(presetPath, JSON.stringify(masterPreset, null, 2) + "\n", "utf8");
    console.log(`[MasterPreset] Đã cập nhật tinh gọn Master Preset ngách [${cleanNiche}] tại: ${presetPath}`);
  } catch (err) {
    console.warn(`[MasterPreset] WARN: Không thể lưu master preset: ${err.message}`);
  }
}

async function main() {
  const inputArg = process.argv[2];
  if (!inputArg) {
    console.error("❌ Lỗi: Vui lòng truyền đường dẫn file video (.mp4) hoặc URL video (TikTok/Shorts/Reels/Douyin).");
    process.exit(1);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("❌ Lỗi: Chưa thiết lập biến môi trường GEMINI_API_KEY.");
    process.exit(1);
  }

  if (!fs.existsSync(PROMPT_PATH)) {
    console.error(`❌ Lỗi: Không tìm thấy file system prompt học phong cách tại: ${PROMPT_PATH}`);
    process.exit(1);
  }

  let absoluteVideoPath = "";
  let isDownloadedTemp = false;

  if (inputArg.startsWith("http://") || inputArg.startsWith("https://")) {
    const downloadRes = downloadVideoFromUrl(inputArg);
    absoluteVideoPath = downloadRes.localPath;
    isDownloadedTemp = downloadRes.isTemp;
  } else {
    absoluteVideoPath = path.resolve(inputArg);
    if (!fs.existsSync(absoluteVideoPath)) {
      console.error(`❌ Lỗi: Không tìm thấy file video tại: ${absoluteVideoPath}`);
      process.exit(1);
    }
  }

  const systemInstruction = fs.readFileSync(PROMPT_PATH, "utf8");
  const videoName = path.basename(absoluteVideoPath, path.extname(absoluteVideoPath));
  console.log(`[StyleLearner] Đang phân tích video viral mẫu: ${videoName}`);

  const ai = new GoogleGenAI({ apiKey });

  let uploadResult;
  try {
    console.log(`[Upload] Đang upload video lên Gemini File API...`);
    uploadResult = await ai.files.upload({
      file: absoluteVideoPath,
      mimeType: "video/mp4",
    });
    console.log(`[Upload] Tải lên thành công: ${uploadResult.name}`);
  } catch (uploadErr) {
    console.error("❌ Lỗi: Không thể upload video lên File API:", uploadErr.message);
    process.exit(1);
  }

  try {
    console.log("[Poll] Đang đợi Gemini xử lý video...");
    let fileState = uploadResult;
    let attempts = 0;
    while (fileState.state === "PROCESSING") {
      attempts++;
      console.log(`[Poll] (#${attempts}) Đang xử lý video, đợi 5s...`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      fileState = await ai.files.get({ name: uploadResult.name });
    }

    if (fileState.state !== "ACTIVE") {
      throw new Error(`Xử lý file thất bại. Trạng thái: ${fileState.state}`);
    }
    console.log("[Poll] Video sẵn sàng phân tích!");

    const candidateModels = ["gemini-3.5-flash", "gemini-3.0-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
    const response = await generateContentWithRetryFallback(
      ai,
      candidateModels,
      [
        {
          fileData: {
            fileUri: fileState.uri,
            mimeType: fileState.mimeType,
          },
        },
        {
          text: "Hãy phân tích kỹ video mẫu này và xuất ra JSON Style Profile & Few-shot examples theo đúng cấu trúc system prompt.",
        },
      ],
      {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      }
    );

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Không nhận được phản hồi từ AI.");
    }

    let parsedResult;
    try {
      parsedResult = JSON.parse(responseText);
    } catch (jsonErr) {
      console.log("Raw response:", responseText);
      throw new Error(`Phản hồi AI không phải JSON hợp lệ: ${jsonErr.message}`);
    }

    fs.mkdirSync(LEARNED_STYLES_DIR, { recursive: true });

    const styleNameRaw = parsedResult.style_profile?.name || videoName;
    const safeStyleFileName = styleNameRaw
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .toLowerCase() + ".json";

    const sanitizedResult = sanitizePresetForFewShot(parsedResult);
    const outputPath = path.join(LEARNED_STYLES_DIR, safeStyleFileName);
    fs.writeFileSync(outputPath, JSON.stringify(sanitizedResult, null, 2), "utf8");

    updateLearnedEffectsRegistry(parsedResult.learned_novel_effects);

    const nicheCategory = parsedResult.style_profile?.category_niche || "general_viral";
    updateMasterNichePreset(nicheCategory, sanitizedResult);

    console.log("");
    console.log("==================================================");
    console.log("🎉 HỌC PHONG CÁCH VIDEO VIRAL HOÀN TẤT!");
    console.log("==================================================");
    console.log(`📌 Tên Phong Cách : ${parsedResult.style_profile?.name || "N/A"}`);
    console.log(`🏷️ Ngách Nội Dung  : ${nicheCategory}`);
    console.log(`⏱️ Thời Lượng Scene: ~${parsedResult.style_profile?.average_scene_duration_s || 0}s`);
    console.log(`⚡ Nhịp Độ Pacing  : ${parsedResult.style_profile?.pacing_speed || "N/A"}`);
    console.log(`📁 File Phong Cách : ${outputPath}`);
    console.log("==================================================");

  } catch (err) {
    console.error("❌ Lỗi khi phân tích phong cách video:", err.message);
    process.exitCode = 1;
  } finally {
    try {
      if (uploadResult && uploadResult.name) {
        await ai.files.delete({ name: uploadResult.name });
        console.log("[Cleanup] Đã dọn dẹp file tạm trên Gemini File API.");
      }
    } catch {}

    if (isDownloadedTemp && fs.existsSync(absoluteVideoPath)) {
      try {
        fs.unlinkSync(absoluteVideoPath);
        console.log("[Cleanup] Đã xóa file video tạm đã tải từ URL.");
      } catch {}
    }
  }
}

main().catch((err) => {
  console.error("❌ Fatal Error:", err);
  process.exit(1);
});
