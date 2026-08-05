# IDEA-007: Next-Gen Dynamic Subtitle Typography, Graphic Badges & Overlay Stickers Engine (CapCut/TikTok 2026 Trend)

> **Mục tiêu:** Nhận định chuẩn hóa theo **Bộ Mẫu Đồ Họa 8:58 PM**, lấy làm chuẩn mực thiết kế Gold Standard cho Auto-Video-Factory. Hợp nhất **IDEA-003 (Dynamic Overlay Stickers)** vào **IDEA-007**, xây dựng Động cơ Đồ Họa Lớp Phủ & Múa Chữ Thống Nhất.

---

## 💡 1. Đặt Vấn Đề & Chuẩn Mực Thiết Kế (Gold Standard Design)

Đối chiếu lại bộ mẫu đồ họa ngày hôm qua (8:58 PM), đây chính là **Chuẩn Mực Thị Giác (Gold Standard)** mà hệ thống sẽ hướng tới:
1. **`VIBRANT_STICKER_LABEL` (Bộ Thẻ Sticker Vàng Chanh Dán Nghiêng 8:58 PM):**  
   * **Đặc điểm:** Thẻ Sticker Vàng Chanh rực rỡ dán xoay nghiêng `-2.5°` có viền đen organic, kết hợp các icon tia sét/ngôi sao lấp lánh sinh động ở góc thẻ. Chữ Đen đậm (`#111111`) tương phản 100%.
2. **`MINIMAL_GLASS_CARD` (Bộ Thẻ Kính Mờ Glassmorphism 8:58 PM):**  
   * **Đặc điểm:** Thẻ kính mờ 3D trong suốt mịn màng với vệt phản quang ánh sáng tinh tế trên góc kính, viền mờ trắng mỏng nhẹ giúp tôn sản phẩm đồ da / thời trang.
3. **`NEON_CYBER_CARD` (Bộ Khung Neon Dạ Quang Tech 8:58 PM):**  
   * **Đặc điểm:** Khung góc Neon Cyan & Magenta phát sáng rực rỡ trên nền kính đen mờ 80%, phù hợp đồ công nghệ / laptop / adapter.
4. **`WARNING_RED_BADGE` (Bộ Thẻ Báo Động Đỏ 3D 8:58 PM):**  
   * **Đặc điểm:** Thẻ Đỏ Tươi 3D nổi bật viền Trắng khối dày, kết hợp icon tam giác cảnh báo `⚠️` bùng nổ cho Hook kịch tính & Báo Giá Sốc 299K.

---

## 🧸 2. Hợp Nhất IDEA-003: Hệ Thống Sticker Chuyển Động & Đồ Họa Động (Unified Overlay Stickers)

```text
 ┌─────────────────────────────────────────────────────────────┐
 │ THƯ VIỆN ĐỒ HỌA THỐNG NHẤT (renderer/assets/overlays/)      │
 ├──────────────────────────────┬──────────────────────────────┤
 │  1. overlays/cards/          │  2. overlays/stickers/       │
 │     - yellow_sticker.png     │     - car_drive.gif / webm   │
 │     - glass_card.png         │     - sparkle_star.png       │
 │     - red_warning_badge.png  │     - discount_tag.png       │
 └──────────────────────────────┴──────────────────────────────┘
                                │
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │ FFMPEG UNIFIED OVERLAY FILTERGRAPH                           │
 │ (Ghép đồng thời Khung Subtitle Badges + Dynamic Stickers)   │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🎨 3. Chi Tiết Kỹ Thuật Tái Tạo Bộ Mẫu 8:58 PM Chuẩn Nhất

* **Tạo File Khung Mẫu PNG Sắc Nét Với Nền Kính/Sticker Hoàn Hảo:**  
  Xuất trực tiếp bộ Khung Mẫu Đồ Họa chuẩn từ các file thiết kế 8:58 PM vào `renderer/assets/overlays/cards/`:
  - `vibrant_yellow_sticker_frame.png` (Khung Sticker Vàng nghiêng kèm icon tia sét)
  - `minimal_glass_card_frame.png` (Khung Kính Mờ Glassmorphism mượt)
  - `neon_cyber_badge_frame.png` (Khung góc Neon Cyan dạ quang)
  - `warning_red_badge_frame.png` (Khung Đỏ 3D viền Trắng bùng nổ)
* **FFmpeg Render Pipeline:**  
  Ghép Khung Mẫu PNG vào đúng vị trí `overlay=x=...:y=...` + căn chữ `drawtext` lọt trọn lòng khung với font chữ Montserrat Bold / Be Vietnam Pro chuẩn 8:58 PM.

---

## 📋 4. Kế Hoạch Lộ Trình Triển Khai (Roadmap)

- [ ] **Giai đoạn 1:** Trích xuất trọn bộ Khung Mẫu PNG chuẩn 8:58 PM vào `renderer/assets/overlays/cards/`.
- [ ] **Giai đoạn 2:** Bổ sung 5 Preset Subtitle mới chuẩn 8:58 PM vào [subtitleStyles.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/subtitleStyles.js).
- [ ] **Giai đoạn 3:** Xây dựng filter graph FFmpeg overlay khung mẫu + căn chữ `drawtext` nằm cân đối 100% trong lòng khung.
- [ ] **Giai đoạn 4:** Render thử nghiệm xác nhận độ nét và độ thẩm mỹ đạt 100% như bộ mẫu 8:58 PM.
