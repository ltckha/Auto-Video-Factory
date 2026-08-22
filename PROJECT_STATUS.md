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
  * `Video-Factory-SCENES`: Chi tiết từng phân cảnh, visual cue, voiceover, hiệu ứng.
  * `Video-Factory-EFFECTS`: Bảng thống kê tỉ lệ thành công của các hiệu ứng nâng cao.

### 💾 Chuẩn Hóa Đường Dẫn Lưu Trữ NAS (Standardized Storage Path)
* **Cấu trúc Thư mục Master:** Lưu trực tiếp tại `/Volumes/Media/Auto-Video-Factory/<projectId>/`
  * `<projectId>.mp4` (File video thành phẩm chuẩn hóa, không còn hậu tố `_final`).
  * `<projectId>.json` (File kịch bản timeline chi tiết).
  * `post.txt` (File text tiêu đề, mô tả và hashtags phục vụ đăng bài).
* **Đường dẫn ghi lên Google Sheets:** Cột `video_path` / `Output File` luôn có định dạng: `/Volumes/Media/Auto-Video-Factory/<projectId>/<projectId>.mp4`.

### 🧠 Xử Lý Video Dài (> 5 Phút) & Phân Đoạn Xuôi Chiều Không Trùng Lặp
* **Cơ chế Smart Proxy 1x ([`renderer/scripts/smartProxyGenerator.js`](renderer/scripts/smartProxyGenerator.js)):**
  * Nén nhẹ về 720p siêu tốc bằng chip Apple M4 trong 5s (~50MB).
  * Giữ **100% tốc độ 1x chuẩn và âm thanh tiếng nói gốc** (Xóa bỏ hoàn toàn Fast Preview 4x gây méo tiếng).
  * Đảm bảo mốc thời gian `start_s` và `end_s` khớp 100.0% với video gốc.
* **Động cơ Phân Đoạn Linh Hoạt & Không Trùng Lặp ([`renderer/prompts/long_highlight_cluster_prompt.md`](renderer/prompts/long_highlight_cluster_prompt.md)):**
  1. *Linh hoạt số lượng:* Tự động chia số lượng Short dựa trên nội dung thực tế (không cố định cứng nhắc).
  2. *Dòng thời gian xuôi chiều:* Các phân cảnh nối tiếp nhau (Short 1 ➔ Short 2 ➔ Short 3), tuyệt đối không lặp lại cảnh cũ giữa các Short.
  3. *Khai thác 4 chiều:* Giá trị cốt lõi, Móc câu 3s, Ranh giới lời nói không cắt cụt, Bộ lọc sạch vùng chết.

### 🎵 Smart BGM Presence Detection (Chống Chèn Đè Nhạc)
* **Nhận diện bằng AI ([`renderer/prompts/long2short_generator_prompt.md`](renderer/prompts/long2short_generator_prompt.md)):** AI tự động nghe kênh âm thanh. Nếu video gốc đã có sẵn nhạc nền/bài hát/ASMR hay ➔ Gán `"has_original_music": true`, `"bgm_mood": "none"`.
* **Bộ lọc Render ([`renderer/scripts/render.js`](renderer/scripts/render.js)):** Khi phát hiện video đã có nhạc gốc ➔ Giữ nguyên 100% âm thanh gốc, **tuyệt đối không mix thêm nhạc ngoài**.

### ✍️ Quy Tắc Outro / CTA Độc Bản (Chống Văn Mẫu)
* Đã xóa bỏ hoàn toàn các câu ví dụ mẫu gây neo định kiến (như "Gói trọn bình yên trong từng chi tiết").
* AI bắt buộc phải sáng tạo câu kết riêng biệt 100% theo đúng nội dung và cảm xúc của từng video.

---

## 2. 🎨 Bộ Khung Đồ Họa Chính Thức & Quy Tắc Render

* **4 Khung Đồ Họa PNG Chuẩn Hóa:**
  1. 🟨 `vibrant_yellow_sticker` (Sticker Vàng Rực Rỡ - Chữ Đen)
  2. 🧊 `minimal_glass_card` (Kính Mờ Sang Trọng - **Chữ Trắng Sáng Tinh Khiết**)
  3. 🚨 `warning_red_badge` (Badge Đỏ Cảnh Báo 3D - Chữ Trắng)
  4. ⚡ `vibrant_yellow_lightning_sticker` (Sét Vàng Accent Outro)
* **Cơ Chế Fallback Sáng Tạo:** Khi AI đề xuất tên Style mới lạ ngoài 4 khung trên, hệ thống tự động ghi nhận vào Backlog [`renderer/config/unmapped_styles_backlog.json`](renderer/config/unmapped_styles_backlog.json) và mapped tạm về `minimal_glass_card`.

---

## 3. 🛡️ Quy Tắc Làm Việc Của AI Assistant
1. **BẮT BUỘC THẢO LUẬN TRƯỚC KHI LÀM (`always_consult_user_first.md`):** Luôn trình bày kế hoạch và xin ý kiến duyệt từ User trước khi sửa code hoặc chạy lệnh.
2. **KHÔNG TỰ Ý PUSH GIT (`git_push_on_user_request_only.md`):** Chỉ thực hiện lệnh push Git khi User yêu cầu rõ ràng.
