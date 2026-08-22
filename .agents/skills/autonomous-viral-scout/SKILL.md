---
name: autonomous-viral-scout
description: Tự động tìm kiếm video ngắn viral theo 4 ngách mục tiêu, trích xuất Style DNA qua learnStyle.js, làm giàu kho preset và cập nhật learned_effects cho Auto-Video-Factory. Sử dụng khi cần săn video mẫu tự động hoặc chạy theo lịch định kỳ.
---
# Autonomous Viral Scout

Autonomous agent workflow for discovering viral short-form videos across 4 core niches, extracting Style DNA using Gemini Multimodal AI via `learnStyle.js`, enriching master presets, and registering new learned effects in Auto-Video-Factory.

## Target Niches & Keywords

1. **mens_fashion___footwear** (Giày da thủ công, đóng giày handmade, thời trang nam cao cấp):
   - Keywords: `handmade leather shoemaking shorts`, `bespoke leather shoes craft shorts`, `luxury shoe stitching asmr shorts`
   - Hashtags: `#shoemaking`, `#leathercraft`, `#bespokeshoes`, `#mensstyle`

2. **asmr_build** (Quy trình chế tác, phục hồi đồ vật, âm thanh chạm khắc, đánh bóng):
   - Keywords: `asmr restoration satisfying shorts`, `wood carving asmr satisfying shorts`, `restoring vintage tools shorts`
   - Hashtags: `#asmrrestoration`, `#craftsmanship`, `#satisfying`, `#woodworking`

3. **lifestyle___fashion_aesthetics** (Phong cách sống chữa lành, decor nhà cửa tối giản):
   - Keywords: `cozy aesthetic morning routine shorts`, `minimalist living aesthetic shorts`, `peaceful countryside cooking shorts`
   - Hashtags: `#cozyvibes`, `#minimalistliving`, `#aesthetic`, `#dailyvlog`

4. **product_showcase** (Mở hộp, test độ bền sản phẩm, biến đổi Before/After):
   - Keywords: `product durability test shorts`, `satisfying unboxing gadget shorts`, `before and after transformation shorts`
   - Hashtags: `#unboxing`, `#productreview`, `#durabilitytest`, `#beforeandafter`

## Execution Flow

### Step 1: Discovery & Filtering
- Search for viral short-form videos (YouTube Shorts / TikTok / Reels) in the target niche for the current rotation.
- Filter criteria:
  - Format: Vertical Shorts (duration <= 60s).
  - High engagement: Triệu view / top view count and high like count.
  - De-duplication: Check against `effects/scouted_history.json` to skip previously analyzed video IDs or URLs.
- Select the #1 top-performing viral video.

### Step 2: Style DNA Extraction
- Run `learnStyle.js` on the selected video URL or local file:
  ```bash
  node renderer/scripts/learnStyle.js "<VIDEO_URL>"
  ```
- `learnStyle.js` automatically downloads the video temporarily via `yt-dlp`, uploads to Gemini File API, and analyzes 6 style layers:
  1. Pacing & Cut rhythm (Nhịp độ cắt cảnh).
  2. Visual Hook strategy in first 3 seconds (Kỹ thuật Visual Hook 3s).
  3. Color grading & lighting (Tông màu & Ánh sáng).
  4. Card layout & Typography (Kiểu thẻ Card phụ đề & Font chữ).
  5. Micro-effects & Transitions (Hiệu ứng vi mô & Chuyển cảnh độc đáo).
  6. Audio cues & ASMR background (Thiết kế âm thanh nền & ASMR cues).

### Step 3: Autonomous File Writing & Enrichment (Tự Động Ghi File Trực Tiếp)
- **TỰ ĐỘNG GHI FILE NGAY LẬP TỨC (Không dừng lại hỏi duyệt):**
  - Ghi file Style Profile mới: `effects/learned_styles/<safe_style_name>.json`
  - Cập nhật Master Niche Preset: `effects/presets/preset_<niche>.json`
  - Đăng ký hiệu ứng mới vào: `effects/learned_effects.json`
  - Cập nhật nhật ký và xoay vòng ngách vào: `effects/scouted_history.json`
- Tự động xóa sạch toàn bộ video tải tạm trong `temp/`.

### Step 4: Changelog Reporting (Báo Cáo Kết Quả Sau Khi Đã Ghi File Xong)
- Xuất bản tóm tắt ngắn gọn cho người dùng:
  - Video viral đã săn (Title, URL, View count).
  - Tên Style DNA và ngách mục tiêu.
  - Các hiệu ứng mới đã được thêm vào hệ thống.
  - Ngách tiếp theo sẽ săn vào 09:00 sáng mai.
