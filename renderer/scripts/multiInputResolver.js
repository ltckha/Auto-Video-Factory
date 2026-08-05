const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

/**
 * Resolves input paths (files or folder) and concats them if multiple MP4 files are provided.
 * @param {string[]} inputPaths - Array of absolute or relative file/folder paths
 * @param {string} tempOutputDir - Working temp directory
 * @returns {{ masterVideoPath: string, totalDuration: number, clipBoundaries: Array<{file: string, start_s: number, end_s: number}>, isMultiInput: boolean }}
 */
function parseInputTokens(inputPaths) {
  const rawList = Array.isArray(inputPaths) ? inputPaths : [inputPaths];
  const paths = [];

  for (const raw of rawList) {
    if (typeof raw !== "string" || !raw.trim()) continue;
    const trimmed = raw.trim();

    // Nếu đường dẫn tồn tại trực tiếp trên đĩa (kể cả có khoảng trắng), dùng luôn không cần parse
    if (fs.existsSync(trimmed) || fs.existsSync(path.resolve(trimmed))) {
      paths.push(trimmed);
      continue;
    }

    // Thử trích xuất các đường dẫn file video (.mp4, .mov...) bằng Regex
    const videoPathRegex = /(?:[a-zA-Z]:\\|\/)[^?\n]*?\.(?:mp4|mov|mkv|avi|webm|flv|m4v)/gi;
    const matches = trimmed.match(videoPathRegex);
    if (matches && matches.length > 0) {
      const validMatches = matches.map((m) => m.trim()).filter((m) => fs.existsSync(m) || fs.existsSync(path.resolve(m)));
      if (validMatches.length > 0) {
        paths.push(...validMatches);
        continue;
      }
    }
    let current = "";
    let inSingle = false;
    let inDouble = false;
    let i = 0;

    while (i < trimmed.length) {
      const char = trimmed[i];

      if (char === "'" && !inDouble) {
        inSingle = !inSingle;
        i++;
        continue;
      }
      if (char === '"' && !inSingle) {
        inDouble = !inDouble;
        i++;
        continue;
      }

      if (!inSingle && !inDouble) {
        if (char === "\\" && i + 1 < trimmed.length) {
          current += trimmed[i + 1];
          i += 2;
          continue;
        }
        if (/\s/.test(char)) {
          if (current.trim()) {
            paths.push(current.trim());
            current = "";
          }
          i++;
          continue;
        }
      }

      current += char;
      i++;
    }

    if (current.trim()) {
      paths.push(current.trim());
    }
  }

  return paths;
}

function resolveMultiInputs(inputPaths, tempOutputDir) {
  let mp4Files = [];
  const parsedPaths = parseInputTokens(inputPaths);

  for (const inputPath of parsedPaths) {
    const resolved = path.resolve(inputPath);
    if (!fs.existsSync(resolved)) continue;

    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      const filesInDir = fs.readdirSync(resolved)
        .filter((f) => f.toLowerCase().endsWith(".mp4"))
        .sort()
        .map((f) => path.join(resolved, f));
      mp4Files.push(...filesInDir);
    } else if (stat.isFile() && resolved.toLowerCase().endsWith(".mp4")) {
      mp4Files.push(resolved);
    }
  }

  if (mp4Files.length === 0) {
    throw new Error("Không tìm thấy file video MP4 hợp lệ trong đầu vào.");
  }

  // Nếu chỉ có 1 file MP4, tính duration và trả về trực tiếp
  if (mp4Files.length === 1) {
    const singleFile = mp4Files[0];
    const duration = getVideoDuration(singleFile);
    return {
      masterVideoPath: singleFile,
      totalDuration: duration,
      clipBoundaries: [{ file: path.basename(singleFile), start_s: 0, end_s: duration }],
      isMultiInput: false,
    };
  }

  // Nếu có nhiều file MP4 -> Ghép lossless bằng FFmpeg
  if (!fs.existsSync(tempOutputDir)) {
    fs.mkdirSync(tempOutputDir, { recursive: true });
  }

  const timestamp = Date.now();
  const concatListPath = path.join(tempOutputDir, `concat_list_${timestamp}.txt`);
  const masterVideoPath = path.join(tempOutputDir, `combined_master_${timestamp}.mp4`);

  let currentOffset = 0;
  const clipBoundaries = [];
  const concatLines = [];

  for (const file of mp4Files) {
    const duration = getVideoDuration(file);
    concatLines.push(`file '${file.replace(/'/g, "'\\''")}'`);
    clipBoundaries.push({
      file: path.basename(file),
      start_s: currentOffset,
      end_s: currentOffset + duration,
    });
    currentOffset += duration;
  }

  fs.writeFileSync(concatListPath, concatLines.join("\n"), "utf8");

  console.log(`[MultiInputResolver] Đang ghép lossless ${mp4Files.length} file clips bằng FFmpeg...`);
  const concatCmd = `ffmpeg -hide_banner -loglevel error -y -f concat -safe 0 -i "${concatListPath}" -c copy "${masterVideoPath}"`;
  execSync(concatCmd, { stdio: "inherit" });

  try {
    if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
  } catch {}

  const totalDuration = getVideoDuration(masterVideoPath);
  console.log(`[MultiInputResolver] ✅ Ghép thành công Master Video: ${totalDuration.toFixed(2)}s (Gồm ${mp4Files.length} clips)`);

  const firstClipName = path.basename(mp4Files[0], path.extname(mp4Files[0]));
  const suggestedProjectId = `${firstClipName}_batch`;

  return {
    masterVideoPath,
    totalDuration,
    clipBoundaries,
    isMultiInput: true,
    suggestedProjectId,
  };
}

function getVideoDuration(videoPath) {
  try {
    const cmd = `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`;
    const out = execSync(cmd, { encoding: "utf8" }).trim();
    const dur = parseFloat(out);
    return Number.isFinite(dur) ? dur : 0;
  } catch (err) {
    console.warn(`[MultiInputResolver] WARN: Không thể lấy thời lượng file ${path.basename(videoPath)}: ${err.message}`);
    return 0;
  }
}

module.exports = {
  resolveMultiInputs,
  getVideoDuration,
};
