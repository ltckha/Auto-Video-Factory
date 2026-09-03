# BẢN ĐỒ NGỮ CẢNH HỆ THỐNG (SYSTEM STATUS & CONTEXT MAP)

> **Cập nhật mới nhất:** 03/09/2026 — Động cơ Remotion Hybrid M6.2, Nhận diện 9 Brand, 8 Khung chữ đồ họa & Cơ chế Tự tiến hóa.

Tài liệu này đóng vai trò là **Bộ nhớ Trạng thái Cục bộ (Local State Memory)** để các AI Assistant đọc nhanh mỗi khi khởi động phiên làm việc mới, giúp nắm bắt ngay tình trạng hệ thống mà không cần quét lại toàn bộ mã nguồn.

---

## 1. Tổng quan Dự án
- **Tên dự án:** Auto-Video-Factory (hoặc AI-Video-Factory).
- **Mục tiêu:** Tự động cắt ghép, dựng video ngắn (Short-form, TikTok, Reels) từ video dài hoặc kịch bản thông qua timeline JSON, Remotion và FFmpeg.
- **Công nghệ chính:** NodeJS (ES6/CommonJS), Remotion v4 (React-based Video Renderer), FFmpeg, FFprobe.
- **Môi trường chạy:** macOS (Apple Silicon M4), lưu trữ trực tiếp trên thư mục mount Nextcloud (`/Users/khan/Developer/Auto-Video-Factory`) và xuất file Master về NAS (`/Volumes/Media/Auto-Video-Factory`).

---

## 2. Các Mốc Chỉnh sửa & Cấu hình Quan trọng (Status: Đang Hoạt Động Tốt)

### 📌 Danh Sách 2 Lệnh Command Cốt Lõi Tinh Gọn (Executable Commands)
- **`generate.command`:** [generate.command](file:///Users/khan/Developer/Auto-Video-Factory/generate.command) — Phân tích video, chọn mode 5 tầng, khớp Style Recipe đã học từ TikTok, và sinh kịch bản JSON.
- **`render.command`:** [render.command](file:///Users/khan/Developer/Auto-Video-Factory/render.command) — Dựng video thành phẩm từ kịch bản JSON qua **Remotion Hybrid Mới** (có fallback FFmpeg Legacy an toàn).
- **Quyền hạn:** Cả 2 lệnh đã được cấp quyền `chmod +x` chuẩn trên macOS.

### 📌 Hệ Thống 9 Thương Hiệu Tự Động (Google Sheets Status Tab Sync)
- Tự động nhận diện và gán chính xác $100\%$ tên Brand vào `video_meta.brand`:
  * `hieu_giay_hai_nancy` (Hiệu giày Hải Nancy)
  * `yen_handmade_leather` (Yen Handmade Leather)
  * `mua_chuan_xai_lau` (Mua Chuẩn Xài Lâu)
  * `yenyen_deals` (YenYen Deals)
  * `macadamia_hai_nancy` (Macadamia Hải Nancy)
  * `o_da_lat_vay_thoi` (Ờ Đà Lạt vậy thôi)
  * `elegant_steps` (Elegant Steps)
  * `yenyen_farm` (YenYen Farm)
  * `yenyen_forest_farm` (YenYen Forest Farm)
  * `general` (Tổng Quát / Không Nhãn Hàng)

### 📌 Bộ 8 Khung Chữ Đồ Họa (Subtitle Card Styles)
- Hỗ trợ toàn diện 8 kiểu khung chữ trong Remotion:
  * `vibrant_yellow_sticker`
  * `minimal_glass_card`
  * `warning_red_badge`
  * `vibrant_yellow_lightning_sticker`
  * `washi_tape` (Khung băng dính mộc mạc)
  * `editorial_line` (Khung tạp chí thanh lịch)
  * `price_tag_pill` (Thẻ bo tròn viên thuốc TMĐT)
  * `neon_glow` (Khung kính phát quang neon cyan)

### 📌 Kỹ Xảo Remotion & Chuyển Động Điện Ảnh
- **Camera Motions:** `cinematic_glide_zoom` (CapCut Graphs Ease Out), `push_out` (co giãn theo intensity), `macro_push`, `punch_zoom`, `drift_cam`.
- **Transitions:** `circle_open` (iris), `paper_rip` (xé giấy), `flip` (lật 3D), `wipe_left/right/up/down`, `slide_up/down`, `fade`.
- **Layout:** `MultiScreenSplit` chia đôi màn hình trên/dưới hoặc trái/phải.
- **Micro Shake:** `micro_jitter_on_beat` vi chấn rung nảy theo nhịp bass.
- **Cinematic Color Grading:** `dark_moody`, `teal_orange`, `warm_cinema`, `clean_minimal`.

### 📌 Cơ Chế Tự Tiến Hóa (Self-Evolution Flywheel)
- `effectGapTelemetry.js` tự động phát hiện hiệu ứng mới chưa có code khi render.
- Tự động áp dụng Safe Fallback để video luôn xuất xưởng đẹp $100\%$.
- Tự động ghi nhận hiệu ứng mới vào `effects/EFFECTS_BACKLOG_AND_FEEDBACK.md` để người dùng duyệt nâng cấp.

---

## 3. Bản đồ Script NodeJS Chính

| File | Vai trò | Hàm / Logic quan trọng |
| :--- | :--- | :--- |
| `renderer-remotion/scripts/render_orchestrator.js` | **Tổng đạo diễn render.** Điều phối Primary Remotion Hybrid Engine & Fallback an toàn. | `orchestrateRenderSingle`, `probeMasterMedia`, `updateEffectSuccessStats` |
| `renderer-remotion/scripts/render_hybrid.js` | **Động cơ Hybrid.** Dựng Visual bằng Remotion + Xử lý Audio bằng FFmpeg. | `renderHybridVideo`, `inspectTimelineAndRecordGaps` |
| `renderer/scripts/generateTimeline.js` | **Đạo diễn AI.** Tương tác Gemini AI, chọn ý tưởng, khớp Style Recipe đã học. | `generateTimeline`, `RESPONSE_SCHEMA`, `findBestMatchingStyle` |
| `renderer/scripts/styleRetriever.js` | **Bộ truy xuất Style cục bộ.** Đọc offline kho `effects/learned_styles/` trong $3\text{ms}$. | `findBestMatchingStyle`, `scoreStyleMatch`, `SYNONYM_MAP` |
| `renderer/scripts/effectGapTelemetry.js` | **Hộp đen theo dõi kỹ xảo.** Tự động ghi nhận hiệu ứng thiếu code vào Backlog. | `inspectTimelineAndRecordGaps`, `KNOWN_CAMERA_MOTIONS` |
| `renderer/scripts/googleSheetsDirectClient.js` | **Đồng bộ Google Sheets trực tiếp.** Ghi nhật ký tiến độ qua Service Account v4. | `appendValues`, `updateValues`, `getValues` |

---

## 4. 🛡️ NGUYÊN TẮC CỐT LÕI CỦA AI ASSISTANT (STRICT RULES)
1. ⚠️ **BẮT BUỘC THẢO LUẬN TRƯỚC KHI LÀM:** Tuyệt đối KHÔNG tự ý viết code, sửa code hay can thiệp hệ thống khi chưa thảo luận và nhận được sự phê duyệt rõ ràng từ User.
2. ⚠️ **KHÔNG TỰ Ý PUSH GIT:** Chỉ thực hiện `git push` khi User trực tiếp yêu cầu trong câu lệnh của lượt tương tác đó (bằng cú pháp như "đẩy lên git đi bạn").
