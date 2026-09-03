# 🧠 Hệ Thống Học Tập & Quản Trị Phong Cách Sáng Tạo (Style Learning System)

> **Cập nhật:** 03/09/2026 — Kiến trúc 2 nguồn nạp tri thức từ Spark & Bộ truy xuất cục bộ (Local Style Retriever).

Tài liệu này đặc tả toàn bộ quy trình thu thập, chuẩn hóa, lưu trữ và tự động hấp thụ các phong cách video viral ngắn (Styles & Effects) trong hệ sinh thái **Auto-Video-Factory**.

---

## 🗺️ 1. BẢN ĐỒ TOÀN CẢNH HỆ THỐNG 2 NGUỒN HỌC

```text
┌─────────────────────────────────────────────────────────────┐
│ NGUỒN 1: CRON HÀNG NGÀY (Spark / Scheduled Scout 09:00 AM)  │
│ • Nhiệm vụ: Tự động săn video triệu view theo 4 ngách       │
│   (mens_fashion___footwear, asmr_build, lifestyle, product) │
│ • Công cụ: Agent định kỳ trích xuất Style DNA               │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ├───► ĐỔ VỀ KHO DỮ LIỆU TẬP TRUNG:
                               │     📂 `effects/learned_styles/<style_name>.json`
                               │                    ▲
┌──────────────────────────────┴────────────────────┴─────────┐
│ NGUỒN 2: THEO YÊU CẦU & CHUYÊN SÂU (Agent TikTok Analyzer)  │
│ • Nhiệm vụ: Phân tích sâu video TikTok (Góc máy, CapCut     │
│   Graphs, Color LUT, SFX Phonk) từ Spark.                   │
│ • Tự động hóa: Sau khi phân tích xong, Spark TỰ ĐỘNG TẢI    │
│   và LƯU FILE TRỰC TIẾP vào `effects/learned_styles/`.      │
│   (Quy trình Zero-Touch $100\%$, không cần thao tác tay).   │
└─────────────────────────────────────────────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │ ⚡ LOCAL STYLE RETRIEVER (`styleRetriever.js`)│
        │ - Quét offline 100% files trong 0.003s       │
        │ - Khớp từ khóa song ngữ & Niche              │
        │ - Bơm Top-1 Style vào Gemini khi dựng        │
        └──────────────────────┬───────────────────────┘
                               │
                               ▼
        🎬 `generate.command` & 🚀 `render.command`
```

---

## 📋 2. CHUẨN SCHEMA FILE PHONG CÁCH (`effects/learned_styles/<name>.json`)

Mọi Agent thu thập (dù từ Nguồn 1 hay Nguồn 2 trong Spark) đều phải tuân thủ nghiêm ngặt cấu trúc JSON chuẩn dưới đây để Remotion và `styleRetriever.js` tự động nhận diện:

```json
{
  "style_profile": {
    "name": "Tên Phong Cách Đầy Đủ (Viết hoa đẹp mắt)",
    "category_niche": "Ngách nội dung (ví dụ: luxury_shoes, asmr_craft, product_showcase)",
    "average_scene_duration_s": 4.5,
    "pacing_speed": "slow_glide | fast | dynamic | medium | pulse",
    "motion_graph": "fast_in_slow_out | ease_in_out | linear | spring",
    "hook_strategy": "Chiến lược mở màn 3s đầu (ví dụ: worm_eye_low_angle_push_in)",
    "preferred_font_layout": "minimal_glass_card | vibrant_yellow_sticker | warning_red_badge | washi_tape | editorial_line | price_tag_pill | neon_glow",
    "graphic_text_frame": {
      "frame_type": "washi_tape | editorial_line | price_tag_pill | neon_glow | minimal_glass_card | vibrant_yellow_sticker | none",
      "background_color": "#f5eee1",
      "border_style": "1px dashed #b8a892",
      "text_color": "#251a12"
    },
    "sfx_strategy": {
      "scene_cut_sfx": "whoosh | paper_tear | none",
      "text_reveal_sfx": "pop | ding | typewriter_click | none",
      "impact_sfx": "bass_drop | riser | none"
    },
    "audio_strategy": "Mô tả âm thanh (ví dụ: ultra_slowed_phonk_sub_bass, native_asmr)",
    "recommended_camera_motion": "cinematic_glide_zoom | macro_push | punch_zoom | drift_cam | push_out | static",
    "impact_effect": "micro_jitter_on_beat | flash_white | rgb_shift | none",
    "color_grading": {
      "mood": "dark_moody | teal_orange | warm_cinema | nightclub_cold | clean_minimal",
      "contrast": "+15%",
      "shadows": "-15%",
      "sharpen": "+25%",
      "temp": "-10 (xanh lạnh)"
    },
    "description": "Mô tả chi tiết bằng tiếng Việt hoặc tiếng Anh về nét đặc trưng của phong cách để Local Style Retriever dùng so khớp từ khóa."
  }
}
```

---

## ⚡ 3. CƠ CHẾ TỰ ĐỘNG BẮT TRÚNG (LOCAL STYLE RETRIEVER)

Hệ thống không nhồi nhét toàn bộ kho style vào Prompt của Gemini nhằm tránh quá tải token. Thay vào đó:
1. **Quét Cục Bộ:** Module `styleRetriever.js` đọc toàn bộ thư mục `effects/learned_styles/`.
2. **Từ Điển Song Ngữ (Bilingual Synonyms):** Tự động ánh xạ các từ ngữ thực tế tiếng Việt sang tiếng Anh:
   * `đánh xi`, `đánh bóng`, `giày da` $\rightarrow$ `shoeshine`, `mirror`, `leather`, `shoes`.
   * `đập hộp`, `rạch dao`, `băng keo` $\rightarrow$ `unboxing`, `knife`, `peel`, `package`.
   * `sát đất`, `lướt êm`, `phonk` $\rightarrow$ `worm_eye`, `glide`, `slowed`, `bass`.
3. **Ngưỡng Tin Cậy (Threshold 0.35):**
   * Nếu điểm tương đồng $\ge 0.35$: Rút ra đúng 5 thông số vàng bơm vào chỉ đạo đạo diễn của Gemini.
   * Nếu điểm $< 0.35$: Trả về `null` để Gemini tự do sáng tạo.

---

## 🛡️ 4. DANH MỤC CÁC PHONG CÁCH TIÊU BIỂU HIỆN CÓ TRONG KHO

| Tên File Style | Thể Loại & Đặc Trưng | Chuyển Động Ưu Tiên |
| :--- | :--- | :---: |
| `dark_cinematic_phonk_slowed_showcase.json` | Giày da/sản phẩm góc cực thấp, nhạc Phonk Slowed, màu tối điện ảnh. | `cinematic_glide_zoom` |
| `master_artisan_mirror_shoeshine_asmr.json` | Đánh xi dưỡng bóng giày tây da bò, ASMR thực địa. | `macro_push` |
| `tactile_tech_unboxing_accessory_asmr.json` | Đập hộp, rạch băng keo, bóc seal thỏa mãn. | `punch_zoom` / `drift_cam` |
| `bespoke_leather_sole_stitching_asmr.json` | Khâu đế giày da thủ công, may chỉ xiên. | `macro_push` |
| `cozy_minimalist_iced_latte_routine.json` | Pha cà phê, du lịch nghỉ dưỡng, phong cách sống Đà Lạt. | `drift_cam` |
| `hydraulic_press_stress_destruction_showcase.json` | Thử nghiệm độ bền, phá hủy kịch tính. | `punch_zoom` |
