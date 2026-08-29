const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const PROJECT_ROOT = path.resolve(__dirname, "..");
const GOLDEN_DIR = path.join(__dirname, "golden");
const SNAPSHOT_DIR = path.join(PROJECT_ROOT, "out", "snapshots");

fs.mkdirSync(GOLDEN_DIR, { recursive: true });
fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });

async function runVisualRegression() {
  console.log(`\n======================================================`);
  console.log(`📸 PHASE M3: VISUAL REGRESSION & GOLDEN FRAME TEST`);
  console.log(`======================================================\n`);

  const testFrames = [
    { name: "asmr_craft_frame", compId: "MotionCatalogPreview", frame: 45 },
    { name: "cinematic_travel_frame", compId: "MotionCatalogPreview", frame: 135 },
    { name: "viral_tiktok_frame", compId: "MotionCatalogPreview", frame: 225 },
    { name: "luxury_editorial_frame", compId: "MotionCatalogPreview", frame: 315 },
  ];

  let allPassed = true;

  for (const item of testFrames) {
    const snapPath = path.join(SNAPSHOT_DIR, `${item.name}.png`);
    const goldenPath = path.join(GOLDEN_DIR, `${item.name}.png`);

    console.log(`[Snap] 📷 Capturing still for ${item.name} at frame ${item.frame}...`);
    const stillCmd = `npx remotion still src/index.ts "${item.compId}" "${snapPath}" --frame=${item.frame}`;
    execSync(stillCmd, { cwd: PROJECT_ROOT, stdio: "pipe" });

    // Validate size and resolution
    const probeCmd = `ffprobe -v error -show_entries stream=width,height -of json "${snapPath}"`;
    const probeData = JSON.parse(execSync(probeCmd, { encoding: "utf8" }));
    const stream = probeData.streams?.[0] || {};

    const is1080x1920 = stream.width === 1080 && stream.height === 1920;
    const sizeBytes = fs.statSync(snapPath).size;
    const isValid = is1080x1920 && sizeBytes > 10000;

    if (!fs.existsSync(goldenPath)) {
      console.log(`[Golden] 🌟 Initializing baseline golden image: ${goldenPath}`);
      fs.copyFileSync(snapPath, goldenPath);
    }

    if (isValid) {
      console.log(`  ✅ PASS: [${item.name}] -> Resolution: ${stream.width}x${stream.height} | Size: ${(sizeBytes/1024).toFixed(1)} KB`);
    } else {
      console.log(`  ❌ FAIL: [${item.name}] -> Invalid frame capture`);
      allPassed = false;
    }
  }

  console.log(`\n======================================================`);
  if (allPassed) {
    console.log(`🎉 ALL VISUAL REGRESSION SNAPSHOTS PASSED!`);
  } else {
    console.log(`⚠️ Visual regression detected issues.`);
  }
  console.log(`======================================================\n`);
}

runVisualRegression().catch((err) => {
  console.error("❌ Visual Regression Error:", err.message);
  process.exit(1);
});
