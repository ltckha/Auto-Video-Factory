#!/usr/bin/env node

/**
 * Auto-Video-Factory - Folder Scanner & Deduplication Engine
 * Scans directories for video files, extracts job_id (filename without ext),
 * deduplicates against Google Sheets tab 'Auto-Video-Factory',
 * and batch-appends new items with empty Status and absolute Input File path.
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const sheetsClient = require("./googleSheetsDirectClient");

const ROOT = path.resolve(__dirname, "..", "..");
const BACKUP_DIR = path.join(ROOT, "renderer", "output", "sheets_backup");
const TRACKER_CSV = path.join(BACKUP_DIR, "projects_tracker.csv");

const VIDEO_EXTENSIONS = new Set([".mp4", ".mov", ".mkv", ".m4v", ".webm", ".avi"]);
const IGNORED_DIRS = new Set([
  ".git",
  "node_modules",
  "temp",
  "temp_concat",
  "rendered",
  "archive",
  "out",
  ".trash",
  "$recycle.bin",
]);

/**
 * Clean path dragged from macOS Terminal or pasted with quotes/backslashes
 */
function cleanPath(raw) {
  if (!raw) return "";
  let p = raw.trim();
  if ((p.startsWith('"') && p.endsWith('"')) || (p.startsWith("'") && p.endsWith("'"))) {
    p = p.slice(1, -1);
  }
  p = p.replace(/\\ /g, " ");
  if (p.startsWith("~/")) {
    p = path.join(os.homedir(), p.slice(2));
  }
  return path.resolve(p);
}

/**
 * Check if a file should be ignored
 */
function isIgnoredFile(filename) {
  if (filename.startsWith(".")) return true;
  const lower = filename.toLowerCase();
  if (
    lower.endsWith("_final.mp4") ||
    lower.endsWith("_preview.mp4") ||
    lower.endsWith("_proxy.mp4") ||
    lower.endsWith("_export.mp4")
  ) {
    return true;
  }
  return false;
}

/**
 * Recursively collect all video files from a directory
 */
function collectVideoFiles(dirPath) {
  const videoFiles = [];

  function walk(currentDir) {
    let entries;
    try {
      entries = fs.readdirSync(currentDir, { withFileTypes: true });
    } catch (err) {
      console.warn(`[Scanner] ⚠️ Không thể đọc thư mục: ${currentDir} (${err.message})`);
      return;
    }

    for (const entry of entries) {
      const name = entry.name;
      if (name.startsWith(".")) continue;

      const fullPath = path.join(currentDir, name);

      if (entry.isDirectory()) {
        if (!IGNORED_DIRS.has(name.toLowerCase())) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(name).toLowerCase();
        if (VIDEO_EXTENSIONS.has(ext) && !isIgnoredFile(name)) {
          videoFiles.push(fullPath);
        }
      }
    }
  }

  walk(dirPath);
  return videoFiles;
}

/**
 * Scan a folder and sync new videos into Google Sheets tab 'Auto-Video-Factory'
 * @param {string} rawFolderPath
 * @returns {Promise<{totalFound: number, addedCount: number, skippedCount: number, addedList: Array<{jobId: string, filePath: string}>}>}
 */
async function scanFolderAndSyncToSheet(rawFolderPath) {
  const targetDir = cleanPath(rawFolderPath);
  if (!fs.existsSync(targetDir)) {
    throw new Error(`Đường dẫn thư mục không tồn tại: ${targetDir}`);
  }

  const stat = fs.statSync(targetDir);
  let filesToProcess = [];

  if (stat.isDirectory()) {
    console.log(`[Scanner] 🔍 Đang quét các file video trong thư mục: ${targetDir}...`);
    filesToProcess = collectVideoFiles(targetDir);
  } else if (stat.isFile()) {
    const ext = path.extname(targetDir).toLowerCase();
    if (VIDEO_EXTENSIONS.has(ext) && !isIgnoredFile(path.basename(targetDir))) {
      filesToProcess = [targetDir];
    }
  }

  console.log(`[Scanner] 📹 Tìm thấy ${filesToProcess.length} file video hợp lệ.`);
  if (filesToProcess.length === 0) {
    return { totalFound: 0, addedCount: 0, skippedCount: 0, addedList: [] };
  }

  // 1. Đọc dữ liệu hiện có trên Google Sheets tab Auto-Video-Factory
  console.log(`[Scanner] 📋 Đang tải danh sách dự án từ Google Sheets (Tab Auto-Video-Factory)...`);
  const rawData = await sheetsClient.getValues("Auto-Video-Factory!A:Z");

  const headers = rawData && rawData.length > 0 ? rawData[0].map((h) => String(h).trim()) : [];
  const jobIdIdx = sheetsClient.findHeaderIndex(headers, "job_id");
  const statusIdx = sheetsClient.findHeaderIndex(headers, "status");
  const inputFileIdx = sheetsClient.findHeaderIndex(headers, "input_file");

  const existingJobIds = new Set();
  const existingInputFiles = new Set();

  if (rawData && rawData.length > 1) {
    for (let r = 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row) continue;
      if (jobIdIdx !== -1 && row[jobIdIdx]) {
        existingJobIds.add(String(row[jobIdIdx]).trim().toLowerCase());
      }
      if (inputFileIdx !== -1 && row[inputFileIdx]) {
        existingInputFiles.add(cleanPath(String(row[inputFileIdx])).toLowerCase());
      }
    }
  }

  console.log(`[Scanner] ℹ️ Đã có ${existingJobIds.size} job_id trên Sheet để đối chiếu lọc trùng.`);

  // 2. Lọc bỏ file trùng lặp
  const addedList = [];
  let skippedCount = 0;

  for (const filePath of filesToProcess) {
    const resolvedPath = path.resolve(filePath);
    const fileName = path.basename(resolvedPath);
    const jobId = path.parse(resolvedPath).name;

    const isDuplicateJobId = existingJobIds.has(jobId.toLowerCase());
    const isDuplicatePath = existingInputFiles.has(resolvedPath.toLowerCase());

    if (isDuplicateJobId || isDuplicatePath) {
      skippedCount++;
      continue;
    }

    // Đánh dấu để tránh trùng nội bộ trong cùng đợt quét
    existingJobIds.add(jobId.toLowerCase());
    existingInputFiles.add(resolvedPath.toLowerCase());

    addedList.push({
      jobId,
      filePath: resolvedPath,
    });
  }

  console.log(`[Scanner] ⚖️ Kết quả lọc: ${addedList.length} video mới | ${skippedCount} video trùng (bỏ qua).`);

  if (addedList.length === 0) {
    return {
      totalFound: filesToProcess.length,
      addedCount: 0,
      skippedCount,
      addedList: [],
    };
  }

  // 3. Batch Append vào Google Sheets theo thứ tự cột chuẩn
  console.log(`[Scanner] 🚀 Đang thêm hàng loạt ${addedList.length} video mới vào Google Sheets...`);
  const rowsToAppend = addedList.map((item) => {
    return headers.map((headerName) => {
      const normH = String(headerName).toLowerCase().replace(/[\s_\-]/g, "");
      if (normH === "jobid" || normH === "projectid") return item.jobId;
      if (normH === "status" || normH === "trangthai") return ""; // Để trống status theo yêu cầu
      if (normH === "inputfile" || normH === "filegoc" || normH === "sourcefile") return item.filePath;
      return "";
    });
  });

  try {
    await sheetsClient.appendValues("Auto-Video-Factory!A1", rowsToAppend);
    console.log(`[Scanner] ✅ Đã nạp thành công ${addedList.length} video mới vào tab Auto-Video-Factory trên Google Sheets!`);
  } catch (sheetErr) {
    console.error(`[Scanner] ❌ Lỗi ghi Google Sheet: ${sheetErr.message}`);
    throw sheetErr;
  }

  // 4. Đồng bộ vào file CSV Backup
  try {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    for (const item of addedList) {
      const csvRow = [
        item.jobId,
        "", // Status trống
        item.filePath,
        "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""
      ];
      const escaped = csvRow.map((val) => `"${String(val).replace(/"/g, '""')}"`);
      fs.appendFileSync(TRACKER_CSV, `${escaped.join(",")}\n`, "utf8");
    }
  } catch (csvErr) {
    console.warn(`[Scanner] WARN: Không thể ghi CSV backup: ${csvErr.message}`);
  }

  return {
    totalFound: filesToProcess.length,
    addedCount: addedList.length,
    skippedCount,
    addedList,
  };
}

// Chạy trực tiếp từ dòng lệnh
if (require.main === module) {
  (async () => {
    let inputFolder = process.argv[2];

    if (!inputFolder) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      inputFolder = await new Promise((resolve) => {
        rl.question("👉 Kéo thả thư mục chứa video vào đây và nhấn [ENTER]: ", (answer) => {
          rl.close();
          resolve(answer);
        });
      });
    }

    if (!inputFolder || !inputFolder.trim()) {
      console.log("❌ Lỗi: Đường dẫn thư mục không được để trống!");
      process.exit(1);
    }

    try {
      console.log("\n==================================================");
      console.log("   AUTO-VIDEO-FACTORY: QUÉT THƯ MỤC VÀO SHEET");
      console.log("==================================================\n");

      const result = await scanFolderAndSyncToSheet(inputFolder);

      console.log("\n==================================================");
      console.log("                    TỔNG KẾT");
      console.log("==================================================");
      console.log(`📹 Tổng video tìm thấy     : ${result.totalFound}`);
      console.log(`⏭️ Video trùng lặp (bỏ qua): ${result.skippedCount}`);
      console.log(`✨ Đã thêm mới vào Sheet   : ${result.addedCount}`);

      if (result.addedList.length > 0) {
        console.log("\nDanh sách video mới trong Hàng đợi (Status trống):");
        result.addedList.slice(0, 10).forEach((it, idx) => {
          console.log(`  ${idx + 1}. [${it.jobId}] -> ${it.filePath}`);
        });
        if (result.addedList.length > 10) {
          console.log(`  ... và ${result.addedList.length - 10} video khác.`);
        }
      }
      console.log("==================================================\n");
      process.exit(0);
    } catch (err) {
      console.error("\n❌ Lỗi quét thư mục:", err.message);
      process.exit(1);
    }
  })();
}

module.exports = {
  scanFolderAndSyncToSheet,
  collectVideoFiles,
  cleanPath,
};
