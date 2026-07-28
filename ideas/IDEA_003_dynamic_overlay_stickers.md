# IDEA-003: Hệ Thống Sticker Chuyển Động Động (Dynamic Animated Overlay Engine)

> ⚠️ **Trạng thái:** 💡 ĐANG NGHIÊN CỨU (RESEARCHING)  
> **Mã ID:** IDEA-003  
> **Ngày tạo:** 2026-07-27  

---

## 📌 Bối Cảnh & Ý Tưởng Sáng Tạo

1. **Gia Tăng Tỷ Lệ Giữ Chân Khán Giả (Dopamine Retention):**  
   Video sản phẩm nếu chỉ quay đơn thuần dễ bị nhàm chán. Việc chèn các Sticker động nền trong suốt (ví dụ: dép in hình xe $\rightarrow$ có 2 chiếc xe sticker chạy qua chạy lại) làm video trở nên sống động, vui nhộn và độc đáo.
2. **Ứng Dụng Đa Ngách:**  
   - Thời trang / Giày dép: Xe chạy, hoa rơi, lấp lánh.
   - Công nghệ / Unboxing: Tia sét neon, biểu tượng sạc pin, hiệu ứng năng lượng.
   - Đồ ăn / Đồ uống: Thả tim, trái tim bay, khói bốc lên.

---

## 🛠️ Giải Pháp Kỹ Thuật Đề Xuất

### 1. Kho Sticker Động Nền Trong Suốt (`effects/stickers/`)
- Lưu trữ các file sticker động nền trong suốt (PNG sequence, transparent WebM hoặc GIF):
  - `effects/stickers/vehicles/car_drive_left_right.gif`
  - `effects/stickers/effects/sparkle_star.gif`
  - `effects/stickers/tech/energy_spark.gif`
  - `effects/stickers/reactions/heart_pop.gif`

### 2. FFmpeg Dynamic Motion Overlay Filter
- Sử dụng bộ lọc `overlay` của FFmpeg kết hợp công thức toán học thời gian $t$:
  - **Xe chạy ngang màn hình (Slide motion):** Tọa độ $X = t \times v$ làm sticker xe trượt mượt từ trái sang phải ở mép dưới video.
  - **Tọa độ cố định (Static anchor):** Đặt ở vị trí góc an toàn (Safe Zone) không che sản phẩm.

### 3. Tích Hợp Gemini AI Auto-Tagging
- Trong Timeline JSON, Gemini AI tự nhận diện chủ đề sản phẩm và đề xuất sticker phù hợp:
  ```json
  "overlay_sticker": {
    "name": "car_drive_left_right",
    "motion_type": "bottom_slide",
    "duration_s": 2.5
  }
  ```

---

## 📝 Nhật Ký Cập Nhật Trạng Thái (Status History)

- **27/07/2026:** Khởi tạo ý tưởng (💡 Draft & Research).
