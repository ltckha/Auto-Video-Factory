const fs = require("fs");
const path = require("path");

const { resolveCreativeSpecification, sanitizeText } = require("../src/styles/creativeResolver");

async function runFuzzingSuite() {
  console.log(`\n======================================================`);
  console.log(`🧪 PHASE M5.5: AI FUZZING & DIRTY DATA ROBUSTNESS SUITE`);
  console.log(`🎯 Testing 12 extreme edge cases, malformed payloads & dirty data`);
  console.log(`======================================================\n`);

  const fuzzCases = [
    {
      id: "FUZZ_01_EMPTY_SUBTITLE",
      name: "Phụ đề chuỗi rỗng ''",
      payload: { content: { text: "" }, intent: { style: "asmr_craft" } },
      check: (res) => res.token && res.intensity > 0,
    },
    {
      id: "FUZZ_02_NULL_UNDEFINED",
      name: "Payload null & undefined hoàn toàn",
      payload: null,
      check: (res) => res.token && res.token.id === "asmr_craft" && res.intensity > 0,
    },
    {
      id: "FUZZ_03_WHITESPACE_ONLY",
      name: "Chuỗi toàn khoảng trắng '\\t\\n   '",
      payload: { content: { title: "   \n\t  " } },
      check: (res) => res.token && res.intensity > 0,
    },
    {
      id: "FUZZ_04_HTML_INJECTION",
      name: "Tấn công mã HTML / XSS Injection tags",
      payload: { content: { title: "<script>alert('xss')</script><b>Đôi Giày</b>" } },
      check: (res) => sanitizeText("<script>alert('xss')</script><b>Đôi Giày</b>") === "alert('xss')Đôi Giày",
    },
    {
      id: "FUZZ_05_SUPER_LONG_TITLE",
      name: "Tiêu đề siêu dài (35 từ không ngắt dòng)",
      payload: {
        content: {
          title: "HƯỚNG DẪN CHI TIẾT TỪNG BƯỚC CÁCH PHỤC HỒI ĐÔI BOOTS DA BÒ Ý BỊ MỐC NẶNG VÀ RÁCH MŨI BẰNG KỸ THUẬT KHÂU TAY TRUYỀN THỐNG CỰC KỲ ĐỈNH CAO CỦA NGHỆ NHÂN LÀNH NGHỀ",
        },
      },
      check: (res) => res.token && res.token.id === "asmr_craft",
    },
    {
      id: "FUZZ_06_NON_EXISTENT_STYLE",
      name: "Style không tồn tại 'super_ultra_3d_unknown'",
      payload: { intent: { style: "super_ultra_3d_unknown" } },
      check: (res) => res.token && res.token.id === "asmr_craft", // Fallback gracefully
    },
    {
      id: "FUZZ_07_NEGATIVE_ENERGY",
      name: "Năng lượng số âm extreme: energy = -999.0",
      payload: { intent: { energy: -999.0 } },
      check: (res) => res.intensity >= 0.1, // Clamped to min 0.1
    },
    {
      id: "FUZZ_08_OVERFLOW_ENERGY",
      name: "Năng lượng tràn số: energy = 8888.88",
      payload: { intent: { energy: 8888.88 } },
      check: (res) => res.intensity <= 1.0, // Clamped to max 1.0
    },
    {
      id: "FUZZ_09_NAN_ENERGY",
      name: "Năng lượng NaN / chuỗi lỗi: energy = 'fast_boost'",
      payload: { intent: { energy: "fast_boost" } },
      check: (res) => !isNaN(res.intensity) && res.intensity > 0,
    },
    {
      id: "FUZZ_10_EMOJI_SPECIAL_CHARS",
      name: "Tiêu đề toàn emoji và ký tự đặc biệt '🔥⚡️🇻🇳✨'",
      payload: { content: { title: "🔥🔥🔥 CỰC HOT ⚡️⚡️⚡️" } },
      check: (res) => res.token && res.intensity > 0,
    },
    {
      id: "FUZZ_11_CONFLICTING_INTENT",
      name: "Xung đột Brand YEN Leather + Style TikTok + Platform Facebook",
      payload: { brand: "yen_leather", intent: { style: "viral_tiktok" }, platform: "facebook" },
      check: (res) => res.token.id === "viral_tiktok" && res.platform === "facebook" && res.intensity <= 1.0,
    },
    {
      id: "FUZZ_12_EMPTY_TIMELINE_OBJECT",
      name: "Object rỗng '{}'",
      payload: {},
      check: (res) => res.token && res.intensity > 0 && res.brand.id === "yen_leather",
    },
  ];

  let passedCount = 0;

  for (const tc of fuzzCases) {
    try {
      const res = resolveCreativeSpecification(tc.payload);
      const isPassed = tc.check(res);
      if (isPassed) {
        passedCount++;
        console.log(`  ✅ PASS: [${tc.id}] -> ${tc.name} (Sanitized safely without crash)`);
      } else {
        console.log(`  ❌ FAIL: [${tc.id}] -> ${tc.name} (Validation check failed)`);
      }
    } catch (err) {
      console.log(`  💥 CRASH: [${tc.id}] -> Unhandled Exception: ${err.message}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 KẾT QUẢ AI FUZZING TEST: ${passedCount}/${fuzzCases.length} PASSED (${((passedCount/fuzzCases.length)*100).toFixed(0)}%)`);
  console.log(`======================================================\n`);

  if (passedCount === fuzzCases.length) {
    console.log(`🎉 TOÀN BỘ 12 CA FUZZING ĐÃ ĐƯỢC XỬ LÝ AN TOÀN VÀ MIỄN NHIỄM 100% VỚI CRASH!\n`);
  }
}

runFuzzingSuite().catch((err) => {
  console.error("Fatal fuzzing error:", err.message);
  process.exit(1);
});
