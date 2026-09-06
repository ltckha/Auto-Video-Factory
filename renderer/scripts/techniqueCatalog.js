const fs = require("fs");
const path = require("path");

/**
 * techniqueCatalog.js
 * 
 * Trích xuất danh mục các thủ pháp nghệ thuật, nhịp điệu và âm thanh 
 * từ kho video triệu view (effects/learned_styles) thành "Tủ Sách Kỹ Thuật" 
 * tinh gọn để AI Đạo Diễn tham khảo và mượn cảm hứng có chọn lọc.
 */

function getLearnedStylesDir() {
  const possibleDirs = [
    path.resolve(__dirname, "../../effects/learned_styles"),
    path.resolve(process.cwd(), "effects/learned_styles"),
    path.resolve(__dirname, "../../../effects/learned_styles"),
  ];
  for (const d of possibleDirs) {
    if (fs.existsSync(d)) return d;
  }
  return null;
}

/**
 * Đọc tất cả style profiles và tổng hợp thành danh mục kỹ thuật tham khảo ngắn gọn
 */
function getCuratedTechniquesCatalog() {
  const lines = [
    "📚 TỦ SÁCH KỸ THUẬT QUAY DỰNG ĐÃ HỌC TỪ VIRAL VIDEO (REFERENCE ONLY - MƯỢN CÓ CHỌN LỌC):",
    "1. CÁC THỦ PHÁP HOOK 3 GIÂY ĐẦU ĐẮT GIÁ:",
    "   - [Instant Percussive Start]: Bắt đầu ngay giây 0.0s bằng cú tác động dứt khoát (nhát dao, nhát búa, tiếng miết mạnh) mà không dạo đầu.",
    "   - [Extreme Macro Texture]: Cận cảnh siêu gần vào vân da, góc cạnh, khuyết điểm hoặc chi tiết bất ngờ để kích thích thị giác.",
    "   - [Contrast Before-After / Problem Framing]: Đặt câu hỏi tò mò hoặc khoe sự xuống cấp/cũ mờ ban đầu để người xem ngóng chờ thành quả.",
    "   - [Zero Subtitle ASMR Hook]: Tắt hoàn toàn phụ đề 3s đầu, chỉ để hình ảnh hành động thuần khiết và âm thanh thực tế cuốn hút người xem.",
    "2. CÁC CÔNG THỨC NHỊP ĐIỆU & CẮT CÚP (PACING & MOTION):",
    "   - [Velocity Ramping]: Cắt nhịp dồn dập ở các thao tác phụ (tua nhanh), hãm chậm 1.0x ở điểm rơi cao trào kỹ thuật.",
    "   - [Rhythmic Audio Jump Cuts]: Cắt chuyển cảnh ăn khớp chính xác với từng âm thanh thao tác (tiếng quẹt, tiếng búng tay, tiếng cạch).",
    "   - [Smooth Cinematic Glide]: Lia máy trôi chậm, tĩnh lặng và thanh lịch, làm nổi bật tính thủ công tinh xảo.",
    "3. CHIẾN LƯỢC ÂM THANH:",
    "   - [Pure Tactile ASMR]: Giữ 100% tiếng động thật (tiếng miết kem, cắt rọc, gõ búa), tuyệt đối không chèn nhạc ồn ào.",
    "   - [Subtle Ambient Bed]: Lồng nhạc nền chill/lo-fi du dương ở mức âm lượng thấp vừa đủ, giữ âm thanh hiện trường làm nhân vật chính."
  ];

  return lines.join("\n");
}

module.exports = {
  getCuratedTechniquesCatalog,
};
