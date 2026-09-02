# 🎬 Auto-Video-Factory - Project Status & Architecture

> **Cập nhật mới nhất:** 02/09/2026

---

## 1. 🌟 Kiến Trúc Hệ Thống Hiện Tại (Current Architecture)

### 🧠 Động Cơ AI Kép (Gemini Model Routing & Priority)
* **Model Phân Tích Video Chính (`heavy_video_analysis`):** Ưu tiên **`gemini-3.6-flash`** (ổn định, mượt mà), dự phòng cấp 1: `gemini-3.7-flash`, dự phòng cấp 2: `gemini-3.5-flash` / `gemini-3.0-flash`.
* **Model Gợi Ý Ý Tưởng (`lightweight_tasks`):** Ưu tiên **`gemini-3.5-flash-lite`** (siêu tốc, hạn ngạch 500 RPD), dự phòng: `gemini-3.1-flash-lite`.
* **Dynamic Video Processing Engine (Chuẩn Google AI Studio 01/09/2026):**
  * **Video dài (> 5 phút / Mode `LongHighlightClusters`):** Kích hoạt `processing: "agentic"` để quét động thông minh, tua nhanh vùng chết và giảm $88\%$ token.
  * **Video ngắn (< 5 phút / Short2Short / Long2Short):** Kích hoạt `processing: "static"` để quét frame-level liên tục tức thì với độ trễ thấp nhất.

### 🧵 Kho Nguyên Vật Liệu Sáng Tạo (Creative Material Layer M6.2)
* **100% Procedural Remotion Code ($< 1\text{MB}$ — Không làm phình dung lượng, sắc nét 4K):**
  * 🧵 `StitchingThread`: Đường may chỉ xiên $45^\circ$ thủ công kèm lỗ đục quả trám 3D.
  * ✏️ `HandMark`: Trọn bộ 8 nét vẽ tay tự nhiên (Circle, Arrow, Check Mark, Cross Mark, Scribble, Bracket Box, Underline, Highlight).
  * 📜 `TornPaperBackground`: Thẻ giấy Kraft xé viền răng cưa mộc mạc.
  * 📎 `PaperClip`: Kẹp giấy kim loại phản quang & Ghim đồng.
  * 🏷️ `KraftTape`: Băng keo dán Washi mờ có góc nghiêng vật lý.
  * 🔨 `EmbossStamp`: Dấu dập chìm nhiệt độ sâu 3D & Con dấu tròn chất lượng nén nảy lò xo (`press_rebound`).
  * ↔️ `BeforeAfterSlider`: Thanh trượt phân đôi màn hình Trước & Sau phục hồi.
  * 🏷️ `PriceTagBadge`: Tag giá thương mại nổi khối kèm giảm giá.
  * 📏 `DimensionLine`: Thước đo milimet thông số độ dày da/kích thước.
  * ✨ `LightSweep` & `SurfaceGrainOverlay`: Vệt sáng quét nổi khối vân da và hạt phim hữu cơ siêu mịn.
* **4 Material Families:** `artisan_leather`, `organic_farm`, `product_showcase`, `editorial_look`.
* **Âm Thanh Xúc Giác (Sonic Foley):** `leather_rub`, `stitch_pull`, `stamp_press`, `paper_tear`, `clip_click`, `whoosh_soft`.

### 🛡️ Bảo Vệ Thương Hiệu Tuyệt Đối (Safe Brand Routing)
* **Logo Chính Thức Đã Đăng Ký:**
  * 👞 Hiệu Giày Hải Nancy: `renderer-remotion/src/brand/assets/logo_hai_nancy.png`
  * 🧵 Yen HANDMADE LEATHER: `renderer-remotion/src/brand/assets/logo_yen_handmade_leather.png`
* **Quy Tắc Bất Di Bất Dịch:**
  * Tuyệt đối KHÔNG tự chế/bịa đặt tên thương hiệu.
  * Chỉ chèn logo khi video được xác định chính xác $100\%$ thuộc thương hiệu đó.
  * Video chia sẻ chung/ASMR: Giữ $100\%$ video sạch, không chèn logo bừa bãi.

### 🎵 Hệ Thống Âm Thanh 3 Tầng Thông Minh (Smart 3-Tier Audio Strategy)
* **Tầng 1 — Video Đã Có Nhạc Sẵn hoặc ASMR Thực Địa:** Gán `"has_original_music": true`, `"bgm_mood": "none"` $\rightarrow$ Giữ nguyên $100\%$ âm thanh gốc, **tuyệt đối không chèn đè nhạc ngoài**.
* **Tầng 2 — Video Câm / Không Có Tiếng:** Gán `"has_original_music": false`, `"audio_strategy": "mix_bgm"` $\rightarrow$ Tự động lồng ghép nhạc nền BGM phù hợp mức âm lượng $50\%$.
* **Tầng 3 — Video Có Tạp Âm / Voice Nói Chuyện Lạ Gây Nhiễu:** Gán `"audio_strategy": "suppress_ambient_voice_and_boost_bgm"` $\rightarrow$ Bộ trộn FFmpeg tự động ép giảm âm lượng tiếng ồn gốc xuống $30\%$ ($-10\text{dB}$) và đẩy âm lượng BGM lên $85\%$ để át tạp âm, mang lại âm thanh sạch sẽ, chuyên nghiệp.

### 🧠 Đề Xuất Ý Tưởng Độc Bản 100% (Context-First Ideation Engine)
* **Xóa Bỏ Hoàn Toàn Anchor Bias (Không Còn Ví Dụ Rập Khuôn):** AI bắt buộc bóc tách vật thể, hành động và điểm bất thường/đắt giá nhất của riêng video đó.
* **Tăng `temperature: 0.85`:** Giúp AI bung vốn từ vựng phong phú, tạo ra 3 góc nhìn tương phản $180^\circ$ (Cảm giác/ASMR $\leftrightarrow$ Chuyên gia/Mẹo nghề $\leftrightarrow$ Kịch tính/Đánh giá trước-sau).

### 📊 Direct Google Sheets API v4
* **Kết nối:** Dùng trực tiếp Google Sheets API v4 qua `google-auth-library` kết hợp khóa xác thực `config/service_account.json`.
* **Spreadsheet ID:** `1Xg67qhp1J_Izt7v5uDKRgKjdEZapX9giKJ_ym0OMJN4`
* **Tab `Auto-Video-Factory`:** Cập nhật trạng thái video (`🎬 Rendered`), `raw_caption` đầy đủ (Title + Hook + Story + Hashtags), cột `Effects Summary` ghi nhận toàn bộ hiệu ứng đã dùng.

### 📌 Bộ 2 Lệnh Command Cốt Lõi Tinh Gọn (Root Executable Commands)
* 🎬 **`generate.command`:** Phân tích video, đề xuất ý tưởng & tạo kịch bản JSON.
* 🚀 **`render.command`:** Dựng video thành phẩm tự động (Hybrid Remotion + FFmpeg).
* 🧠 **Hấp thụ tri thức phong cách tự động:** Toàn bộ các file style JSON mới do người dùng nạp hàng ngày tại [`effects/learned_styles/`](file:///Users/khan/Developer/Auto-Video-Factory/effects/learned_styles) được Remotion tự động quét và nạp $100\%$ vào kho dữ liệu mà không cần can thiệp thủ công.

---

## 2. 📋 Master Effects Registry & Feedback Loop
* Mọi hiệu ứng đang chạy, hàng đợi nâng cấp và danh sách cấm được quản lý tập trung tại:
  👉 [`effects/EFFECTS_BACKLOG_AND_FEEDBACK.md`](effects/EFFECTS_BACKLOG_AND_FEEDBACK.md)

---

## 3. 🛡️ QUY TẮC BẮT BUỘC DÀNH CHO AI ASSISTANT
1. ⚠️ **BẮT BUỘC THẢO LUẬN & XIN PHÉP TRƯỚC KHI LÀM:** Tuyệt đối KHÔNG tự ý viết code, sửa code hay chạy lệnh can thiệp khi chưa thảo luận và nhận được sự đồng ý rõ ràng từ User.
2. ⚠️ **TUYỆT ĐỐI KHÔNG TỰ Ý PUSH GIT:** Chỉ thực hiện lệnh `git push` hoặc `git commit` khi User trực tiếp ra lệnh trong lượt tương tác đó.
