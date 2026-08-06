# IDEA-008: Video Style Cohesion & Card Transparency Positioning Rules (Studio Brand Identity)

> **Mục tiêu:** Nâng cấp tính chuyên nghiệp cho video bằng cách **thống nhất 1 Style Khung & Chữ chủ đạo xuyên suốt toàn bộ video**, đồng thời tối ưu hóa **tọa độ đặt Khung theo độ trong suốt (Transparent Glass vs Solid Opaque Card)**.

---

## 💡 1. Đặt Vấn Đề & Định Hướng Cải Tiến

### Quy tắc 1: Phân Loại Tọa Độ Đặt Theo Độ Trong Suốt Của Khung (Card Transparency Positioning Rules)
* **Khung Trong Suốt / Glassmorphism (`minimal_glass_card`, `framed_card`):**
  - **Đặc điểm:** Nền mờ kính 3D trong suốt, nhìn xuyên qua được bối cảnh video bên dưới.
  - **Tọa độ đặt:** Linh hoạt nhiều vị trí (`top` 5%, `center`, `bottom` 68%) mà không lo làm bức bối hay che khuất chủ thể.
* **Khung Đặc Màu / Solid Color Cards (`vibrant_yellow_sticker`, `warning_red_badge`, `cta_red`):**
  - **Đặc điểm:** Nền màu đặc 100% (Vàng rực, Đỏ báo động) có độ tương phản và tác động thị giác cực mạnh.
  - **Tọa độ đặt:** Khống chế nghiêm ngặt ở vùng an toàn (`top` 5% sát mép đỉnh hoặc `bottom` 68% sát mép chân). Tuyệt đối không đặt giữa màn hình (`center`) làm che khuất sản phẩm/gương mặt.

---

### Quy tắc 2: Thống Nhất 1 Style Xuyên Suốt Video (Single Video Brand Cohesion)
* **Vấn đề hiện tại:** Mỗi phân cảnh AI có thể chọn 1 kiểu Khung khác nhau (cảnh 1 dùng Sticker Vàng, cảnh 2 dùng Kính Mờ, cảnh 3 dùng Sét Vàng, cảnh 4 dùng Badge Đỏ). Việc pha trộn quá nhiều Khung khiến video bị vụn và thiếu tính nhận diện thương hiệu.
* **Quy tắc mới (Brand Consistency):**
  1. **Primary Style (Khung Chủ Đạo):** Chọn 1 Style duy nhất làm ngôn ngữ thiết kế chính cho toàn bộ các cảnh trong video.
  2. **CTA Accent Exception (Ngoại Lệ Nhấn Mạnh):** Chỉ cho phép chuyển sang Style Accent (`cta_red` / `warning_red_badge`) ở duy nhất phân cảnh cuối cùng (Call To Action).

---

## 📋 2. Kế Hoạch Lộ Trình Triển Khai (Roadmap)

- [x] **Giai đoạn 1:** Cập nhật `short2short_generator_prompt.md` quy định AI chọn 01 `primary_style` nhất quán xuyên suốt thân video.
- [x] **Giai đoạn 2:** Cập nhật `effectControl.js` và `render.js` thực thi khóa cứng Style Khung đồng nhất toàn video, ngoại lệ cho phép phân cảnh cuối dùng ⚡ `vibrant_yellow_lightning_sticker` hoặc 🚨 `warning_red_badge`.
- [ ] **Giai đoạn 3:** Cập nhật bộ thuật toán vị trí Khung theo độ trong suốt (Glassmorphism -> linh hoạt, Solid -> khóa Y 5%).
