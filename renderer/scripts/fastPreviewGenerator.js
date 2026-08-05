const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Generates a lightweight 4x fast preview video for long videos (> 5 mins) to upload to Gemini File API fast.
 * @param {string} masterVideoPath - Path to master source video
 * @param {string} tempOutputDir - Directory to save preview
 * @param {number} speedFactor - Fast preview speed multiplier (default 4.0)
 * @returns {string} Path to fast preview video file
 */
function generateFastPreview(masterVideoPath, tempOutputDir, speedFactor = 4.0) {
  if (!fs.existsSync(tempOutputDir)) {
    fs.mkdirSync(tempOutputDir, { recursive: true });
  }

  const baseName = path.basename(masterVideoPath, path.extname(masterVideoPath));
  const previewPath = path.join(tempOutputDir, `${baseName}_fast_preview.mp4`);

  if (fs.existsSync(previewPath)) {
    return previewPath;
  }

  console.log(`[FastPreviewGenerator] Đang nén & tua nhanh ${speedFactor}x tạo Fast Preview siêu nhẹ cho Gemini API...`);
  const setptsVal = (1.0 / speedFactor).toFixed(4);
  const cmd = `ffmpeg -hide_banner -loglevel error -y -i "${masterVideoPath}" -filter_complex "[0:v]setpts=${setptsVal}*PTS,fps=15,scale=540:960[vout]" -map "[vout]" -an -c:v libx264 -preset ultrafast -crf 28 "${previewPath}"`;

  execSync(cmd, { stdio: "inherit" });
  console.log(`[FastPreviewGenerator] ✅ Tạo Fast Preview thành công: ${previewPath}`);

  return previewPath;
}

module.exports = {
  generateFastPreview,
};
