# 🎬 Auto-Video-Factory - Project Status & Architecture

> **Cập nhật mới nhất:** 21/08/2026

---

## 1. 🌟 Kiến Trúc Hiện Tại (Current Architecture)

### 📊 Direct Google Sheets API v4 (100% Zero Google Apps Script)
* **Kết nối:** Dùng trực tiếp Google Sheets API v4 qua `google-auth-library` kết hợp khóa xác thực `config/service_account.json`.
* **Spreadsheet ID:** `1Xg67qhp1J_Izt7v5uDKRgKjdEZapX9giKJ_ym0OMJN4`
* **Module điều khiển:** [`renderer/scripts/googleSheetsDirectClient.js`](renderer/scripts/googleSheetsDirectClient.js) và [`renderer/scripts/googleSheetsSync.js`](renderer/scripts/googleSheetsSync.js).
* **Cơ chế:** 100% Dynamic Header Mapping (Dò tìm vị trí cột theo tên tiêu đề Hàng 1, miễn nhiễm lệch cột).
* **Các Tab đồng bộ tự động:**
  * `Auto-Video-Factory`: Cập nhật trạng thái video (`🎬 Rendered`, đường dẫn `video_path`, metadata).
  * `Video-Factory-EFFECTS`: Bảng thống kê tỉ lệ thành công của các hiệu ứng nâng cao.
  *(Đã loại bỏ tab `Video-Factory-SCENES` theo yêu cầu tối ưu hệ thống).*

### 💾 Chuẩn Hóa Đường Dẫn Lưu Trữ NAS (Standardized Storage Path)
* **Cấu trúc Thư mục Master:** Lưu trực tiếp tại `/Volumes/Media/Auto-Video-Factory/<projectId>/`
  * `<projectId>.mp4` (File video thành phẩm chuẩn hóa, không còn hậu tố `_final`).
  * `<projectId>.json` (File kịch bản timeline chi tiết).
  * `post.txt` (File text tiêu đề, mô tả và hashtags phục vụ đăng bài).
* **Đường dẫn ghi lên Google Sheets:** Cột `video_path` / `Output File` luôn có định dạng: `/Volumes/Media/Auto-Video-Factory/<projectId>/<projectId>.mp4`.

### 🧠 Tối Ưu Smart Proxy 1x (Kích Hoạt Kép: Thời Lượng > 5m HOẶC Dung Lượng > 200MB)
* **Cơ chế Smart Proxy 1x ([`renderer/scripts/smartProxyGenerator.js`](renderer/scripts/smartProxyGenerator.js)):**
  * Tự động kích hoạt khi video **dài > 5 phút (300s)** HOẶC có **dung lượng file > 200MB** (video 4K/HDR nặng).
  * Nén nhẹ về 720p siêu tốc bằng chip Apple M4 trong 3-5s (~30-50MB).
  * Giữ **100% tốc độ 1x chuẩn và âm thanh tiếng nói gốc** (Xóa bỏ hoàn toàn Fast Preview 4x gây méo tiếng).
  * Đảm bảo mốc thời gian `start_s` và `end_s` khớp 100.0% với video gốc.
* **Động cơ Trích Xuất Phân Đoạn Trực Diện (Direct Highlight Cutter - Single-Pass 1.0x Natural Speed):**
  1. *Linh hoạt số lượng:* Tự động trích xuất toàn bộ các Short độc lập có giá trị cao nhất dựa trên nội dung thực tế (không ép cứng số lượng).
  2. *Dòng thời gian xuôi chiều & Không trùng lặp:* Các phân cảnh nối tiếp nhau (Short 1 ➔ Short 2 ➔ Short 3), lọc sạch hoàn toàn các vùng chết giữa các công đoạn.
  3. *Tốc độ 1.0x tự nhiên (1:1 Natural Speed):* `duration_s = end_s - start_s` trong vùng vàng 30s-55s, **xóa bỏ hoàn toàn việc tua nhanh ép nén thời gian (no speedup distortion)**, bảo toàn 100% nhịp điệu tự nhiên và âm thanh ASMR thực tế.
  4. *Đầy đủ dữ liệu trong 1 lần chạy:* Sinh sẵn phân cảnh con, thẻ chữ Kinetic Pop-up (hiện 2.5s rồi tắt), chuyển cảnh Fade/Wipe, bài viết Social Post hoàn chỉnh và đồng bộ ngay sang Google Sheets.

### 🎵 Smart BGM Presence Detection (Chống Chèn Đè Nhạc)
* **Nhận diện bằng AI ([`renderer/prompts/long2short_generator_prompt.md`](renderer/prompts/long2short_generator_prompt.md)):** AI tự động nghe kênh âm thanh. Nếu video gốc đã có sẵn nhạc nền/bài hát/ASMR hay ➔ Gán `"has_original_music": true`, `"bgm_mood": "none"`.
* **Bộ lọc Render ([`renderer/scripts/render.js`](renderer/scripts/render.js)):** Khi phát hiện video đã có nhạc gốc ➔ Giữ nguyên 100% âm thanh gốc, **tuyệt đối không mix thêm nhạc ngoài**.

### ✍️ Quy Tắc Outro / CTA Độc Bản (Chống Văn Mẫu)
* Đã xóa bỏ hoàn toàn các câu ví dụ mẫu gây neo định kiến (như "Gói trọn bình yên trong từng chi tiết").
* AI bắt buộc phải sáng tạo câu kết riêng biệt 100% theo đúng nội dung và cảm xúc của từng video.

### 📝 Bài Viết Mạng Xã Hội Hoàn Chỉnh (`post.txt`)
* File `post.txt` xuất bản ra NAS theo cấu trúc **Full Social Post** 3 phần:
  * 🎣 **Mở bài (Hook Line):** 1–2 câu mở màn giật tít, khơi gợi tò mò.
  * 📖 **Thân bài (Story & Value):** Đoạn văn 2–3 câu chia sẻ câu chuyện, kiến thức hoặc mẹo hay sâu sắc.
  * 💬 **Lời kết (Outro / Engagement):** Câu kết đọng lại cảm xúc nhẹ nhàng hoặc câu hỏi kéo bình luận.
  * 🏷️ **Hashtags:** Bộ 5–8 hashtags chuẩn ngách chuyên sâu.

### ⏱️ Dynamic Subtitle Timing & Chuyển Cảnh Time-Jump Rõ Nét
* **Hiển thị thông minh 2.5s đầu:** Thẻ Card/Subtitle chỉ xuất hiện trong **2.5s đầu của phân cảnh** để người xem kịp nắm thông điệp rồi tự động biến mất (`enable='lte(t, 2.5)'`), trả lại 100% không gian thị giác sạch sẽ cho các chi tiết thao tác ASMR.
* **Hỗ trợ Style `none`:** Ẩn hoàn toàn phụ đề ở các cảnh cận cảnh macro ASMR.
* **Chuyển cảnh Time-Jump rõ nét:** Khi cắt bỏ đoạn thừa để nhảy cóc sang công đoạn mới, ưu tiên dùng các hiệu ứng dứt khoát: `wipe_left`, `wipe_right`, `slide_up`, `circle_open`, `pixelize`.

---

## 2. 🎨 Bộ Khung Đồ Họa Chính Thức & Quy Tắc Render

* **4 Khung Đồ Họa PNG Chuẩn Hóa + Tùy chọn Ẩn:**
  1. 🟨 `vibrant_yellow_sticker` (Sticker Vàng Rực Rỡ - Chữ Đen)
  2. 🧊 `minimal_glass_card` (Kính Mờ Sang Trọng - **Chữ Trắng Sáng Tinh Khiết**)
  3. 🚨 `warning_red_badge` (Badge Đỏ Cảnh Báo 3D - Chữ Trắng)
  4. ⚡ `vibrant_yellow_lightning_sticker` (Sét Vàng Accent Outro)
  5. 🚫 `none` (Ẩn hoàn toàn phụ đề cho cảnh quay cận cảnh ASMR)

---

## 3. 🛡️ Quy Tắc Làm Việc Của AI Assistant
1. **BẮT BUỘC THẢO LUẬN TRƯỚC KHI LÀM (`always_consult_user_first.md`):** Luôn trình bày kế hoạch và xin ý kiến duyệt từ User trước khi sửa code hoặc chạy lệnh.
2. **KHÔNG TỰ Ý PUSH GIT (`git_push_on_user_request_only.md`):** Chỉ thực hiện lệnh push Git khi User yêu cầu rõ ràng.
