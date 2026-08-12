const readline = require("readline");

/**
 * Màn hình Tương tác Human-in-the-Loop cho phép người dùng Review,
 * Sửa mốc thời gian & Tiêu đề nội dung trước khi AI dựng kịch bản chi tiết!
 */
async function reviewAndEditClusters(clusters) {
  if (!clusters || clusters.length === 0) return clusters;

  console.log("\n==================================================");
  console.log("🎯 DANH SÁCH AI ĐỀ XUẤT CHÙM VIDEO NGẮN (BATCH SHORTS):");
  console.log("==================================================");

  clusters.forEach((c, idx) => {
    const timeStr = (c.timecodes || [])
      .map((t) => `${t.start || "0s"} - ${t.end || "0s"}`)
      .join(", ");
    console.log(`\n [${idx + 1}] Short #${idx + 1}: ${c.cluster_title || "Video Ngắn"}`);
    console.log(`     ⏱️ Mốc thời gian : ${timeStr || "Tự động"}`);
    if (c.narrative_focus) {
      console.log(`     🎯 Định hướng   : ${c.narrative_focus}`);
    }
  });

  console.log("\n==================================================");
  console.log("👉 BẠN CÓ MUỐN ĐIỀU CHỈNH KỊCH BẢN KHÔNG?");
  console.log("   [1] Đồng ý & Tiến hành tạo ngay (Mặc định - Tự động sau 10s)");
  console.log("   [2] Chỉnh sửa Mốc thời gian & Tiêu đề/Nội dung");
  console.log("   [3] Chọn lọc / Xóa bớt Short");
  console.log("==================================================\n");

  const choice = await promptWithTimeout("Nhập lựa chọn của bạn [Mặc định 1 (tự động sau 10s)]: ", 10);

  if (choice === "2") {
    return await editClustersInteractively(clusters);
  } else if (choice === "3") {
    return await filterClustersInteractively(clusters);
  }

  console.log("👉 Đã chốt danh sách đề xuất (Mặc định). Đang tiến hành tạo Timeline...");
  return clusters;
}

function promptWithTimeout(promptText, timeoutSec = 10) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    let timer = setTimeout(() => {
      rl.close();
      console.log(`\n⏱️ Hết 10s đếm ngược -> Tự động chọn Mặc định [1].`);
      resolve("1");
    }, timeoutSec * 1000);

    rl.question(promptText, (answer) => {
      clearTimeout(timer);
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askQuestion(rl, query) {
  return new Promise((resolve) => rl.question(query, (ans) => resolve(ans.trim())));
}

async function editClustersInteractively(clusters) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n✏️  CHẾ ĐỘ TỰ TAY CHỈNH SỬA MỐC THỜI GIAN & TIÊU ĐỀ NỘI DUNG:");
  console.log("--------------------------------------------------");

  const edited = [];
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const oldTimeStr = (c.timecodes || []).map((t) => `${t.start || "0s"}-${t.end || "0s"}`).join(", ");

    console.log(`\n📌 Short #${i + 1}: ${c.cluster_title}`);
    console.log(`   Mốc hiện tại : ${oldTimeStr}`);

    const newTime = await askQuestion(
      rl,
      `   - Nhập mốc thời gian mới (Ví dụ: 01:05-02:40) [Enter giữ nguyên]: `
    );
    const newTitle = await askQuestion(
      rl,
      `   - Nhập Tiêu đề / Nội dung mới [Enter giữ nguyên]: `
    );
    const newFocus = await askQuestion(
      rl,
      `   - Nhập Định hướng kịch bản mới [Enter giữ nguyên]: `
    );

    const updatedCluster = { ...c };
    if (newTitle) updatedCluster.cluster_title = newTitle;
    if (newFocus) updatedCluster.narrative_focus = newFocus;

    if (newTime) {
      // Parse format như 01:05-02:40 hoặc 65-160 hoặc 1:05 - 2:40
      const parsedTime = parseTimeStringToSeconds(newTime);
      if (parsedTime) {
        updatedCluster.timecodes = [parsedTime];
      } else {
        console.warn(`   ⚠️ Định dạng mốc thời gian không hợp lệ, giữ nguyên mốc cũ.`);
      }
    }

    edited.push(updatedCluster);
    console.log(`   ✅ Đã cập nhật Short #${i + 1}: "${updatedCluster.cluster_title}" (${(updatedCluster.timecodes || []).map(t => `${t.start}-${t.end}`).join(", ")})`);
  }

  rl.close();
  return edited;
}

async function filterClustersInteractively(clusters) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n🗑️  CHẾ ĐỘ CHỌN LỌC SHORT:");
  const answer = await askQuestion(
    rl,
    `Nhập danh sách số thứ tự Short muốn GIỮ LẠI (Ví dụ: 1, 3): `
  );
  rl.close();

  if (!answer) return clusters;

  const keepIndices = answer
    .split(",")
    .map((s) => parseInt(s.trim(), 10) - 1)
    .filter((idx) => !isNaN(idx) && idx >= 0 && idx < clusters.length);

  if (keepIndices.length === 0) {
    console.warn("⚠️ Không có Short hợp lệ nào được chọn, giữ nguyên tất cả.");
    return clusters;
  }

  const filtered = keepIndices.map((idx) => clusters[idx]);
  console.log(`✅ Đã chọn ${filtered.length} Short để tiến hành dựng.`);
  return filtered;
}

function parseTimeStringToSeconds(str) {
  try {
    const parts = str.split("-").map((s) => s.trim());
    if (parts.length < 2) return null;

    function toSec(s) {
      if (s.includes(":")) {
        const t = s.split(":");
        if (t.length === 2) return parseInt(t[0], 10) * 60 + parseFloat(t[1]);
        if (t.length === 3) return parseInt(t[0], 10) * 3600 + parseInt(t[1], 10) * 60 + parseFloat(t[2]);
      }
      return parseFloat(s.replace("s", ""));
    }

    const startSec = toSec(parts[0]);
    const endSec = toSec(parts[1]);

    if (isNaN(startSec) || isNaN(endSec) || startSec >= endSec) return null;

    return {
      start: `${startSec}s`,
      end: `${endSec}s`,
      start_s: startSec,
      end_s: endSec,
    };
  } catch {
    return null;
  }
}

module.exports = { reviewAndEditClusters };
