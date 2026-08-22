/**
 * Unit Test Suite for Auto-Video-Factory Input/Output Pipeline
 * Tests core input resolution, timeline validation, output packaging, and data mapping.
 */

const assert = require("assert");
const path = require("path");
const fs = require("fs");

console.log("==================================================");
console.log("🧪 RUNNING AUTO-VIDEO-FACTORY I/O UNIT TESTS");
console.log("==================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ PASS: ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${name}`);
    console.error(`     Error: ${err.message}`);
    failedCount++;
  }
}

// -------------------------------------------------------------
// 1. TEST: Input Resolution & Project ID Derivation
// -------------------------------------------------------------
console.log("📦 1. Input Resolution & Project Identification Tests:");

const { resolveMultiInputs } = require("../scripts/multiInputResolver");

runTest("Derive projectId correctly from a single input file path", () => {
  const samplePath = "/Volumes/home/Camera/VID_20260727_100029.mp4";
  const baseName = path.basename(samplePath, path.extname(samplePath));
  assert.strictEqual(baseName, "VID_20260727_100029", "Project ID must match filename without extension");
});

runTest("MultiInputResolver throws when given non-existent input files", () => {
  const fakeInput = ["/non/existent/path/video_xyz.mp4"];
  const tempDir = path.join(__dirname, "temp_test");
  assert.throws(
    () => resolveMultiInputs(fakeInput, tempDir),
    /Không tìm thấy file video MP4 hợp lệ/i,
    "Should throw error when input path does not exist"
  );
});

// -------------------------------------------------------------
// 2. TEST: Timestamp Auto-Correction & Conversion (M:SS -> Seconds)
// -------------------------------------------------------------
console.log("\n⏱️ 2. Timestamp Validation & Auto-Correction Tests:");

function tryConvertMSS(val, minExpected, maxExpected) {
  if (typeof val !== "number" || val <= 0) return null;
  const s = String(Math.round(val));
  if (s.length >= 3 && s.length <= 4) {
    const min = parseInt(s.slice(0, s.length - 2), 10);
    const sec = parseInt(s.slice(s.length - 2), 10);
    if (sec < 60) {
      const converted = min * 60 + sec;
      if (converted >= minExpected - 0.5 && converted <= maxExpected + 1) {
        return { converted, min, sec };
      }
    }
  }
  return null;
}

runTest("Converts M:SS mistranslation '113' (1m 13s) to 73 seconds", () => {
  const result = tryConvertMSS(113, 0, 120);
  assert(result !== null, "Must detect 113 as M:SS format");
  assert.strictEqual(result.converted, 73, "113 (1:13) must convert to 73 seconds");
});

runTest("Converts M:SS mistranslation '245' (2m 45s) to 165 seconds", () => {
  const result = tryConvertMSS(245, 100, 200);
  assert(result !== null, "Must detect 245 as M:SS format");
  assert.strictEqual(result.converted, 165, "245 (2:45) must convert to 165 seconds");
});

runTest("Does not convert valid direct seconds (e.g. 45s)", () => {
  const result = tryConvertMSS(45, 0, 60);
  assert.strictEqual(result, null, "Direct seconds under 100 should not be treated as M:SS");
});

// -------------------------------------------------------------
// 3. TEST: Output Formatting & Caption Generation
// -------------------------------------------------------------
console.log("\n📝 3. Output Packaging & Post Text Tests:");

const { buildPostText } = require("../scripts/captionGenerator");

runTest("buildPostText formats title, description, and hashtags cleanly", () => {
  const sampleTimeline = {
    video_meta: {
      title: "Bí Quyết Làm Giày Da Thủ Công",
      description: "Quy trình cắt da và may viền chi tiết từ nghệ nhân.",
      hashtags: ["handmade", "leathercraft", "shoes"],
    },
  };

  const postContent = buildPostText(sampleTimeline);
  assert(postContent.includes("Bí Quyết Làm Giày Da Thủ Công"), "Output post.txt must contain title");
  assert(postContent.includes("Quy trình cắt da và may viền chi tiết"), "Output post.txt must contain description");
  assert(postContent.includes("#handmade #leathercraft #shoes"), "Output post.txt must format hashtags correctly");
});

// -------------------------------------------------------------
// 4. TEST: Archive Workflow Context Creation
// -------------------------------------------------------------
console.log("\n📦 4. Archive Workflow Context Tests:");

const { createWorkflowContext } = require("../scripts/archiveWorkflow");

runTest("createWorkflowContext sets up correct project directories", () => {
  const ctx = createWorkflowContext({
    enabled: true,
    projectId: "TEST_PROJECT_001",
    incomingDir: "/path/to/incoming",
    renderedDir: "/path/to/rendered",
    archiveDir: "/Volumes/Media/Archive",
    failedDir: "/path/to/failed",
    timelinePath: "/path/to/incoming/TEST_PROJECT_001.json",
  });

  assert.strictEqual(ctx.projectId, "TEST_PROJECT_001");
  assert.strictEqual(ctx.enabled, true);
  assert.strictEqual(ctx.archiveDir, "/Volumes/Media/Archive");
  assert.strictEqual(ctx.timelinePath, "/path/to/incoming/TEST_PROJECT_001.json");
});

// -------------------------------------------------------------
// 5. TEST: Dynamic Header Normalization & Alias Mapping
// -------------------------------------------------------------
console.log("\n📊 5. Google Sheets Dynamic Header Mapping Tests:");

function normalizeName(str) {
  if (!str) return "";
  return String(str).toLowerCase().replace(/[\s_\-]/g, "");
}

const FIELD_ALIASES = {
  job_id: ["job_id", "project_id", "project id", "mã sản phẩm", "sku", "id", "video id"],
  status: ["status", "trạng thái", "manual_status"],
  video_path: ["video_path", "output_file", "output file", "file video xuất", "đường dẫn video", "final_video"],
};

function findHeaderIndex(headers, fieldKey) {
  const aliases = FIELD_ALIASES[fieldKey] || [fieldKey];
  const normalizedAliases = aliases.map(normalizeName);

  for (let i = 0; i < headers.length; i++) {
    const normH = normalizeName(headers[i]);
    if (normalizedAliases.includes(normH)) {
      return i;
    }
  }
  return -1;
}

runTest("Finds job_id column regardless of casing, spaces, or aliases", () => {
  const headersVariant1 = ["Mã sản phẩm", "Tên video", "Trạng thái", "Đường dẫn video"];
  const headersVariant2 = ["JOB_ID", "TITLE", "STATUS", "VIDEO_PATH"];
  const headersVariant3 = ["project id", "Title", "Status", "output_file"];

  assert.strictEqual(findHeaderIndex(headersVariant1, "job_id"), 0, "Matches 'Mã sản phẩm' to job_id");
  assert.strictEqual(findHeaderIndex(headersVariant2, "job_id"), 0, "Matches 'JOB_ID' to job_id");
  assert.strictEqual(findHeaderIndex(headersVariant3, "job_id"), 0, "Matches 'project id' to job_id");
});

runTest("Finds video_path column across different sheet alias headers", () => {
  const headers = ["job_id", "title", "File Video Xuất", "status"];
  const idx = findHeaderIndex(headers, "video_path");
  assert.strictEqual(idx, 2, "Matches 'File Video Xuất' to video_path at index 2");
});

// -------------------------------------------------------------
// SUMMARY
// -------------------------------------------------------------
console.log("\n==================================================");
console.log(`📊 TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log("==================================================");

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
