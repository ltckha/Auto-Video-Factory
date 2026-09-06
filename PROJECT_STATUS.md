# 🎬 Auto-Video-Factory - Project Status & Architecture

> **Cập nhật mới nhất:** 06/09/2026 — Hoàn thiện Hàng đợi Auto-Queue & Ingestion (`scan.command`, `generate.command` Auto-Next 3 video), Bổ sung Gemini 3.8 Flash, Remotion Hybrid M6.2, Nhận diện 9 Brand, Bộ 8 Khung Chữ Đồ Họa & Cơ Chế Tự Tiến Hóa (Self-Evolution).

---

## 1. 🌟 Kiến Trúc Hệ Thống Hiện Tại (Current Architecture)

### 🧠 Động Cơ AI Kép (Gemini Model Routing & Priority)
* **Model Phân Tích Video Chính (`heavy_video_analysis`):** Ưu tiên **`gemini-3.8-flash`** (mới nhất), dự phòng cấp 1: `gemini-3.6-flash`, dự phòng cấp 2: `gemini-3.7-flash`, dự phòng cấp 3: `gemini-3.5-flash` / `gemini-2.5-flash`.
* **Model Gợi Ý Ý Tưởng (`lightweight_tasks`):** Ưu tiên **`gemini-3.5-flash-lite`** (siêu tốc, hạn ngạch 500 RPD), dự phòng: `gemini-3.1-flash-lite`.
* **Dynamic Video Processing Engine (Chuẩn Google AI Studio 01/09/2026):**
  * **Video dài (> 5 phút / Mode `LongHighlightClusters`):** Kích hoạt `processing: "agentic"` để quét động thông minh, tua nhanh vùng chết và giảm $88\%$ token.
  * **Video ngắn (< 5 phút / Short2Short / Long2Short):** Kích hoạt `processing: "static"` để quét frame-level liên tục tức thì với độ trễ thấp nhất.

### 🏷️ Hệ Thống 9 Thương Hiệu Tự Động (9-Brand Ecosystem from Google Sheets Status Tab)
* **Đồng bộ trực tiếp:** Nạp danh mục 9 thương hiệu chính thức vào bộ não Gemini AI để tự động nhận diện ngách nội dung từ video gốc:
  1. `hieu_giay_hai_nancy`: Giày da nam công sở, phục hồi giày, đánh xi dưỡng bóng da, đóng giày.
  2. `yen_handmade_leather`: Đồ da may tay thủ công cao cấp (chỉ may xiên, ví da, thắt lưng, túi xách bespoke).
  3. `mua_chuan_xai_lau`: Đập hộp, review độ bền, phụ kiện công nghệ (ốp lưng MagSafe, cáp sạc, đồ gia dụng).
  4. `yenyen_deals`: Săn sale, deals hời, review sản phẩm giá tốt, affiliate.
  5. `macadamia_hai_nancy`: Hạt mắc ca sấy nứt vỏ, nông sản sấy đặc sản Tây Nguyên.
  6. `o_da_lat_vay_thoi`: Phong cách sống Đà Lạt, du lịch, sương mù, cà phê chill, homestay.
  7. `elegant_steps`: Giày thời trang nữ/nam, phong cách bước đi thanh lịch, dạo phố.
  8. `yenyen_farm`: Nông trại hữu cơ, trồng trọt và thu hoạch rau củ quả.
  9. `yenyen_forest_farm`: Nông nghiệp dưới tán rừng, thảo mộc, sinh thái tự nhiên.
  10. `general`: Nội dung đời thường, tự do (giữ video sạch $100\%$, không logo).

### 🎨 Bộ 8 Khung Chữ Đồ Họa Sáng Tạo (8 Graphic Subtitle Presets)
* **Nhóm Đồ Họa Truyền Thống:**
  * 🟨 `vibrant_yellow_sticker`: Nhãn dán vàng 3D, viền đen dày, bóng đổ cứng nổi bật.
  * 🧊 `minimal_glass_card`: Kính mờ sang trọng, viền mỏng thanh lịch.
  * 🚨 `warning_red_badge`: Thẻ đỏ cảnh báo, viền vàng kim sắc sảo.
  * ⚡ `vibrant_yellow_lightning_sticker`: Nhãn dán vàng tia sét năng lượng cao.
* **Nhóm Đồ Họa Mới Tinh (03/09/2026):**
  * 📜 `washi_tape`: Dải băng dính giấy kraft be nhạt `#f5eee1`, viền nét đứt mộc mạc, chữ nâu espresso `#251a12`. Chuẩn đồ da may tay YEN Leather.
  * 📰 `editorial_line`: Nền trong suốt $100\%$, chữ trắng lớn sang trọng kèm 1 vạch line vàng kim $6\text{px}$ mép trái. Chuẩn thời trang cao cấp Hải Nancy, Elegant Steps.
  * 🛍️ `price_tag_pill`: Thẻ bo tròn viên thuốc gradient cam lửa `#FF6B00`, viền vàng kim, chữ trắng nổi khối. Chuẩn Mua Chuẩn Xài Lâu, YenYen Deals.
  * 💡 `neon_glow`: Khung kính phát quang viền neon cyan `#00F0FF` tỏa sáng 2 lớp. Chuẩn Phonk Slowed.

### 🎥 Chuyển Động Máy Quay & Đồ Thị Graphs (CapCut Ease Out)
* **Đồ thị Ease Out toán học:** $Progress = 1 - (1 - t)^{2.5}$ đến $1 - (1 - t)^3$ trong `cameraPrimitives.ts`:
  * `cinematic_glide_zoom`: Lướt nhanh dứt khoát lúc đầu rồi hãm phanh trôi cực êm ở cuối cảnh.
  * `push_out`: Lùi máy quay từ cận cảnh ra toàn cảnh, co giãn độ lùi theo `intensity` ($0.1 \rightarrow 1.0$).
  * `macro_push`: Zoom đẩy từ từ vào chi tiết thao tác tay (chuẩn ASMR).
  * `punch_zoom`: Zoom nảy bật lò xo dồn dập (chuẩn mở màn Hook).
  * `drift_cam`: Trôi ngang bồng bềnh êm ái (chuẩn cảnh thiên nhiên Đà Lạt).

### 🔲 Bố Cục Chia Màn Hình & Chỉnh Màu Điện Ảnh
* **`MultiScreenSplit`:** Chia đôi khung hình song song (`top_bottom` hoặc `left_right`) đồng bộ 2 góc máy (toàn cảnh & cận cảnh thao tác).
* **`micro_jitter_on_beat`:** Vi chấn rung nảy $\pm 2\text{px}$ đến $3.5\text{px}$ đúng lúc âm bass đập xuống.
* **`CinematicColorGrade`:** 4 bộ lọc CSS filter siêu nhẹ ($0\%$ lag): `dark_moody`, `teal_orange`, `warm_cinema`, `clean_minimal`.

### 🔄 Cơ Chế Tự Tiến Hóa & Hàng Đợi Nâng Cấp (Self-Evolution Flywheel)
* **Runtime Telemetry (`effectGapTelemetry.js`):** Tự động soi kịch bản khi render.
* **Safe Fallback:** Nếu AI sáng tạo ra hiệu ứng mới chưa có code, hệ thống tự động thế chỗ bằng hiệu ứng an toàn để video vẫn render đẹp $100\%$.
* **Auto-Logger:** Tự động ghi nhận hiệu ứng mới vào bảng `🚨 PHẦN 3: HÀNG ĐỢI NÂNG CẤP` trong [`EFFECTS_BACKLOG_AND_FEEDBACK.md`](file:///Users/khan/Developer/Auto-Video-Factory/effects/EFFECTS_BACKLOG_AND_FEEDBACK.md) để người dùng duyệt nâng cấp cho lần sau.

### 📊 Direct Google Sheets API v4
* **Đồng bộ 2 chiều:** Tự động cập nhật tiến độ render, thời gian chạy, dung lượng, và phân tích hiệu ứng lên bảng tính Google Sheet tại:
  `https://docs.google.com/spreadsheets/d/1Xg67qhp1J_Izt7v5uDKRgKjdEZapX9giKJ_ym0OMJN4/edit`
  * Tab `Auto-Video-Factory`: Nhật ký dự án sản xuất & Hàng đợi video tự động.
  * Tab `Video-Factory-EFFECTS`: Bảng thống kê tần suất và tỷ lệ thành công của các hiệu ứng (6 cột chuẩn Remotion).
  * Tab `Status`: Bảng trạng thái vận hành của 9 thương hiệu.

### ⚡ Hệ Thống Hàng Đợi Tự Động Hóa (Auto-Queue & Folder Ingestion Engine - 06/09/2026)
* **`scan.command` (Quét thư mục & Lọc trùng):**
  * Quét đệ quy toàn bộ thư mục video (`.mp4`, `.mov`, `.mkv`, `.m4v`, `.webm`, `.avi`).
  * Trích xuất `job_id` là tên file không đuôi.
  * Đối chiếu hai chiều với Google Sheets: Nếu `job_id` hoặc đường dẫn `Input File` đã có trên Sheet $\rightarrow$ tự động bỏ qua $100\%$ an toàn.
  * Nạp hàng loạt (batch append 1 API request duy nhất) các video mới vào tab `Auto-Video-Factory` với `Status` để trống `""`.
* **`generate.command` (Tự động nhận diện Hàng đợi & Vòng lặp Auto-Next):**
  * Nhấn [ENTER] (để trống) để tự động lấy video đầu tiên có `Status` trống từ Google Sheet chạy tạo kịch bản AI.
  * Sau khi render, hệ thống luôn hỏi tiếp tục: Đếm ngược 10 giây nếu không thao tác thì tự động lấy video tiếp theo chạy tiếp.
  * Giới hạn an toàn: Tối đa 3 video liên tiếp mỗi phiên, tự động thoát sau 10s khi xong.
* **Chiến lược Âm thanh 3 tầng chống méo tiếng người (Speed Ramping Audio Mix):**
  * Hạ âm thanh gốc xuống $15\%$ khi có speedup/slowmo để giữ tiếng môi trường êm dịu, triệt tiêu méo tiếng the thé (chipmunk voice).
  * Nâng nhạc nền BGM lên $85\%$ và tự động fade-out êm dịu ở cuối video.
