const readline = require("readline");

/**
 * Bộ đếm lùi thời gian Terminal Prompt
 */
function promptWithTimeout(promptText, timeoutSec = 10) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let timer = setTimeout(() => {
      rl.close();
      console.log(`\n⏱️ Hết ${timeoutSec}s đếm ngược -> Tự động chọn Ý tưởng [1] (Khuyên dùng).`);
      resolve("1");
    }, timeoutSec * 1000);

    rl.question(promptText, (answer) => {
      clearTimeout(timer);
      rl.close();
      resolve((answer || "1").trim());
    });
  });
}

/**
 * Hiển thị 3 ý tưởng góc nhìn sáng tạo và cho phép người dùng chọn nhanh
 * @param {Array} ideas Mảng 3 ý tưởng từ Gemini AI
 * @returns {Promise<Object>} Ý tưởng được lựa chọn
 */
async function selectCreativeIdea(ideas) {
  if (!Array.isArray(ideas) || ideas.length === 0) {
    return null;
  }

  console.log("\n==================================================");
  console.log("🎯 GEMINI AI ĐÃ PHÁT HIỆN CÁC Ý TƯỞNG DỰNG SÁNG TẠO:");
  console.log("==================================================");

  ideas.forEach((item, idx) => {
    const isRecommended = idx === 0 || item.is_recommended;
    const tag = isRecommended ? " - [KHUYÊN DÙNG]" : "";
    const scoreStr = item.viral_score ? `(Điểm viral: ${item.viral_score}/10)` : "";

    console.log(`\n [${idx + 1}] 🎬 ${item.angle_name || `Ý Tưởng #${idx + 1}`} ${scoreStr}${tag}`);
    if (item.hook_summary) {
      console.log(`     🎣 Móc câu (Hook): ${item.hook_summary}`);
    }
    if (item.style_direction) {
      console.log(`     🎨 Phong cách    : ${item.style_direction}`);
    }
    if (item.audio_strategy_detail) {
      console.log(`     🎵 Âm thanh      : ${item.audio_strategy_detail}`);
    }
  });

  console.log("\n==================================================");
  console.log("👉 BẠN CHỌN Ý TƯỞNG NÀO ĐỂ DỰNG VIDEO?");
  for (let i = 0; i < ideas.length; i++) {
    const recText = i === 0 ? " (Mặc định - Tự động sau 10s)" : "";
    console.log(`   [${i + 1}] ${ideas[i]?.angle_name || `Ý Tưởng ${i + 1}`}${recText}`);
  }
  console.log("==================================================\n");

  const choiceStr = await promptWithTimeout("Nhập lựa chọn của bạn [Mặc định 1 (tự động sau 10s)]: ", 10);
  const choiceNum = parseInt(choiceStr, 10);

  let selectedIndex = 0;
  if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= ideas.length) {
    selectedIndex = choiceNum - 1;
  }

  const chosen = ideas[selectedIndex];
  console.log(`👉 ĐÃ CHỐT: [${selectedIndex + 1}] ${chosen.angle_name}. Đang tiến hành tạo Timeline chi tiết...\n`);
  return chosen;
}

module.exports = {
  selectCreativeIdea,
  promptWithTimeout,
};
