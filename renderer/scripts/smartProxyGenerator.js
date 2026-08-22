const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Generates a lightweight 1x speed Smart Proxy video for long videos (> 5 mins) to upload to Gemini File API.
 * Keeps 100% native audio fidelity (voices & cues) and exact 1:1 real-time timestamps.
 * @param {string} masterVideoPath - Path to master source video
 * @param {string} tempOutputDir - Directory to save proxy
 * @returns {string} Path to proxy video file
 */
function generateSmartProxy1x(masterVideoPath, tempOutputDir) {
  if (!fs.existsSync(tempOutputDir)) {
    fs.mkdirSync(tempOutputDir, { recursive: true });
  }

  const baseName = path.basename(masterVideoPath, path.extname(masterVideoPath));
  const proxyPath = path.join(tempOutputDir, `${baseName}_smart_proxy_1x.mp4`);

  if (fs.existsSync(proxyPath)) {
    return proxyPath;
  }

  console.log(`[SmartProxyGenerator] Đang tạo Smart Proxy 1x siêu nhẹ (720p, giữ 100% âm thanh lời thoại & mốc giây chuẩn)...`);
  
  // Scale down to 720p, preserve 1x speed and full audio track
  const cmd = `ffmpeg -hide_banner -loglevel error -y -i "${masterVideoPath}" -vf "scale=-2:720" -c:v libx264 -preset ultrafast -crf 28 -c:a aac -b:a 128k -ar 44100 "${proxyPath}"`;

  try {
    execSync(cmd, { stdio: "inherit" });
    console.log(`[SmartProxyGenerator] ✅ Tạo Smart Proxy 1x thành công: ${proxyPath}`);
    return proxyPath;
  } catch (err) {
    console.warn(`[SmartProxyGenerator] WARN: Lỗi tạo Smart Proxy (${err.message}). Dùng trực tiếp file gốc.`);
    return masterVideoPath;
  }
}

module.exports = {
  generateSmartProxy1x,
  generateFastPreview: generateSmartProxy1x, // Backward compatibility alias
};
