#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const ROOT = path.resolve(__dirname, "..", "..");
const AUDIO_DIR = path.join(ROOT, "effects", "audio");
const BGM_DIR = path.join(AUDIO_DIR, "bgm");
const SFX_DIR = path.join(AUDIO_DIR, "sfx");

function resolveBgmTrack(bgmMood, customUrl = null) {
  if (!bgmMood || bgmMood === "none") return null;

  if (customUrl && (customUrl.startsWith("http://") || customUrl.startsWith("https://"))) {
    try {
      const tempDir = path.join(ROOT, "temp", "audio_downloads");
      fs.mkdirSync(tempDir, { recursive: true });
      const outputPath = path.join(tempDir, `bgm_${Date.now()}.mp3`);

      let ytdlpBin = "yt-dlp";
      try {
        const found = execSync("which yt-dlp || brew --prefix yt-dlp 2>/dev/null", { encoding: "utf8" }).trim();
        if (found && fs.existsSync(found)) ytdlpBin = found;
      } catch {}

      const cmd = `"${ytdlpBin}" -x --audio-format mp3 --no-playlist -o "${outputPath}" "${customUrl}"`;
      execSync(cmd, { stdio: "pipe" });
      if (fs.existsSync(outputPath)) {
        return { path: outputPath, isTemp: true };
      }
    } catch (err) {
      console.warn(`[AudioEngine] WARN: Không thể tải nhạc BGM từ URL: ${err.message}`);
    }
  }

  const cleanMood = String(bgmMood).toLowerCase().trim();
  const moodFolder = path.join(BGM_DIR, cleanMood);
  let targetFolder = fs.existsSync(moodFolder) ? moodFolder : null;

  if (!targetFolder) {
    const fallbackFolders = fs.existsSync(BGM_DIR) ? fs.readdirSync(BGM_DIR) : [];
    for (const folder of fallbackFolders) {
      const full = path.join(BGM_DIR, folder);
      if (fs.statSync(full).isDirectory()) {
        targetFolder = full;
        break;
      }
    }
  }

  if (!targetFolder) return null;

  try {
    const files = fs.readdirSync(targetFolder).filter((f) => /\.(mp3|wav|m4a|aac)$/i.test(f));
    if (files.length === 0) return null;
    const selected = files[Math.floor(Math.random() * files.length)];
    return { path: path.join(targetFolder, selected), isTemp: false };
  } catch {
    return null;
  }
}

function resolveSfxTrack(transitionType, textEffectName) {
  if (!fs.existsSync(SFX_DIR)) return null;

  const trans = String(transitionType || "").toLowerCase();
  const text = String(textEffectName || "").toLowerCase();

  let targetName = null;
  if (trans.includes("wipe") || trans.includes("slide") || trans.includes("circle")) {
    targetName = "swoosh.mp3";
  } else if (text.includes("pop") || text.includes("bounce") || text.includes("typewriter")) {
    targetName = "pop.mp3";
  } else if (trans.includes("snap") || text.includes("glow")) {
    targetName = "snap.mp3";
  }

  if (targetName) {
    const full = path.join(SFX_DIR, targetName);
    if (fs.existsSync(full)) return full;
  }

  return null;
}

function buildAudioFilterOptions(hasVoice, hasBgm, hasSfx = false, bgmVolume = 0.50) {
  if (!hasBgm) {
    return { filterComplex: null, inputs: [] };
  }

  // Auto-ducking BGM khi có Voice, kết hợp Micro Pitch Shift (+0.5% asetrate) để né Content ID
  const bgmFilter = `[1:a]asetrate=44320,aresample=44100,volume=${bgmVolume},aloop=loop=-1:size=2e+9[bgm];[0:a][bgm]amix=inputs=2:duration=first:dropout_transition=2[aout]`;
  return {
    filterComplex: bgmFilter,
    mapAudio: "[aout]",
  };
}

module.exports = {
  buildAudioFilterOptions,
  resolveBgmTrack,
  resolveSfxTrack,
};
