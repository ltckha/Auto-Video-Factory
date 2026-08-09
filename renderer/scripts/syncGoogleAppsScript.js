#!/usr/bin/env node

/**
 * Auto-Sync Google Apps Script Engine across all 3 projects:
 *   1. Auto-Video-Factory (renderer/scripts/google_apps_script.js)
 *   2. Omni-Video         (scripts/google_apps_script.js)
 *   3. Video-Post         (config/google_apps_script.gs)
 *
 * Compares modification timestamps and content checksums to automatically
 * keep all 3 project files 100% synchronized!
 */

const fs = require("fs");
const path = require("path");

const DEVELOPER_DIR = path.resolve(__dirname, "..", "..", "..");

const FILES = [
  path.join(DEVELOPER_DIR, "Auto-Video-Factory", "renderer", "scripts", "google_apps_script.js"),
  path.join(DEVELOPER_DIR, "Omni-Video", "scripts", "google_apps_script.js"),
  path.join(DEVELOPER_DIR, "Video-Post", "config", "google_apps_script.gs"),
];

function syncAppsScripts() {
  console.log("🔄 Checking Google Apps Script sync status across 3 projects...");

  const fileInfos = FILES.map((filePath) => {
    if (!fs.existsSync(filePath)) {
      return { path: filePath, exists: false, mtime: 0, content: "" };
    }
    const stat = fs.statSync(filePath);
    const content = fs.readFileSync(filePath, "utf8");
    return {
      path: filePath,
      exists: true,
      mtime: stat.mtimeMs,
      content,
    };
  });

  // Find the newest modified file that exists
  const existingFiles = fileInfos.filter((f) => f.exists);
  if (existingFiles.length === 0) {
    console.warn("⚠️ No Apps Script files found to sync.");
    return;
  }

  existingFiles.sort((a, b) => b.mtime - a.mtime);
  const newestFile = existingFiles[0];

  console.log(`📌 Source Master File: ${newestFile.path} (Last modified: ${new Date(newestFile.mtime).toLocaleString()})`);

  let syncCount = 0;
  for (const info of fileInfos) {
    if (info.path !== newestFile.path && info.content !== newestFile.content) {
      fs.mkdirSync(path.dirname(info.path), { recursive: true });
      fs.writeFileSync(info.path, newestFile.content, "utf8");
      console.log(`✅ Synced updated script to: ${info.path}`);
      syncCount++;
    }
  }

  if (syncCount === 0) {
    console.log("✨ All 3 Apps Script files are already 100% synchronized and up-to-date!");
  } else {
    console.log(`🎉 Successfully synchronized ${syncCount} Apps Script file(s)!`);
  }
}

if (require.main === module) {
  syncAppsScripts();
}

module.exports = { syncAppsScripts };
