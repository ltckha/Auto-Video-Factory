# 💡 IDEA-006: Intent-Driven Editing & Micro-Effects Engine (TikTok/CapCut 2026 Trend)

> **Trạng thái:** 🚧 **Đang Triển Khai (In Progress)**  
> **Ngày tạo:** 04/08/2026  
> **Cập nhật mới:** 04/08/2026 (Tích hợp 32 Điểm Kiến Trúc Biên Tập CapCut/TikTok 2026)  
> **Hạng mục:** Động Cơ Dựng Phim AI & Hiệu Ứng Hình Ảnh (AI Editorial & Visual Engine)

---

## 🎯 1. TỔNG QUAN Ý TƯỞNG (OVERVIEW)

Nâng cấp hệ thống Auto-Video-Factory từ *"Công cụ ghép video tự động bằng FFmpeg"* lên **"Hệ Thống Đạo Diễn AI Biên Tập Theo Ý Định & Nhịp Điệu (Intent-Driven & Rhythm Video Producer)"** bắt kịp xu hướng TikTok Creative Center & CapCut 2026.

Thay vì nhồi nhét hiệu ứng kéo dài hay dùng các chuyển cảnh Slide/Circle ngẫu nhiên ngớ ngẩn, hệ thống chuyển sang tư duy:
1. **Transition Grammar:** Loại bỏ 100% chuyển cảnh slide/circle ngẫu nhiên. Thay bằng 5 quy tắc chuyển cảnh đỉnh cao: `hard_cut` (mặc định 70%), `flash_cut` (chớp 60ms), `zoom_match`, `motion_match`, `speed_match`.
2. **Effect Recipes (Combo Đóng Gói):** Nhóm các hiệu ứng vi mô thành bộ Combo nghệ thuật (`HOOK_ATTACK`, `PRODUCT_REVEAL`, `PRICE_REVEAL`, `BEFORE_AFTER_SNAP`, `CTA_REVEAL`).
3. **Velocity & Beat Engine:** Tích hợp `velocity_hit` (0.00-1.00 Normal ➔ FAST ➔ SLOW ➔ FAST ➔ Normal) giật nảy đúng nốt nhạc ("BỤP!").
4. **Kinetic & Impact Text:** Chữ nổ `impact_text` (`scale 65% -> 125% -> 100%` + micro shake) và `text_emphasis` chỉ rực rỡ đúng từ khóa ăn tiền ("DA BÒ THẬT", "299K").
5. **Effect Budget & Cooldown Control:** Giới hạn quota hiệu ứng mỗi video và cài đặt `same_effect_cooldown = 2 scenes` ngăn lặp lại hiệu ứng liên tục.
6. **Style DNA:** Định nghĩa mã gen dựng video (`TikTok Viral Fast` dồn dập vs `Luxury Leather` sang trọng thư thái).

---

## 🏗️ 2. KIẾN TRÚC KỸ THUẬT VÀ 5 MÔ-ĐUN CỐT LÕI

### Mô-đun 1: Transition Grammar Engine (`transitionGrammar.js`)
* Bỏ hoàn toàn việc AI chọn ngẫu nhiên `circle_open` hay `wipe_left`.
* Tự động áp dụng 5 quy tắc chuyển cảnh có lý do hình ảnh:
  - `hard_cut`: Cắt thẳng 0s (Mặc định).
  - `flash_cut`: Cắt cảnh kèm chớp sáng 60ms–120ms.
  - `zoom_match`: Cảnh 1 Zoom in 115% ➔ Cảnh 2 Zoom out 115%.
  - `motion_match`: Nối 2 cảnh cùng hướng di chuyển máy ảnh.
  - `speed_match`: Nối 2 cảnh cùng nhịp tua Velocity.

### Mô-đun 2: Effect Recipes & Combo Stacks (`effectRecipes.js`)
Đóng gói các bộ Combo nghệ thuật chuyên nghiệp:
```javascript
const EFFECT_RECIPES = {
  HOOK_ATTACK: ["jumpcut", "punch_zoom_108", "micro_shake_0.2s", "impact_text_pop"],
  PRODUCT_REVEAL: ["slow_push_1.5s", "flash_white_0.1s", "punch_zoom", "micro_shake", "keyword_highlight"],
  PRICE_REVEAL: ["freeze_frame_0.3s", "punch_zoom", "impact_text_scale125", "micro_shake"],
  BEFORE_AFTER_SNAP: ["slow_zoom", "flash_white", "velocity_hit", "impact_text"],
  CTA_REVEAL: ["slow_push", "keyword_highlight", "button_pop"]
};
```

### Mô-đun 3: Velocity & Beat Engine (`velocityEngine.js`)
Thực thi các nhịp tua giật nảy Velocity Hit (SlowMo ➔ Fast ➔ SlowMo) khớp với nhịp BGM nốt trầm/trống.

### Mô-đun 4: Kinetic & Impact Text Engine (`kineticTextEngine.js`)
* **Pop Overshoot:** Chữ nổ `scale 65% -> 125% -> 100%` trong 0.25s.
* **Text Emphasis:** Chỉ phóng to/rực rỡ đúng từ khóa quan trọng (`text_emphasis`) thay vì làm nổ cả câu.

### Mô-đun 5: Effect Budget & Cooldown Control (`effectControl.js`)
* `effect_budget`: Quota cho từng video (Max 3 Flashes, 4 Shakes, 5 Punch Zooms). Khi hết quota ➔ Fallback về `hard_cut`.
* `same_effect_cooldown = 2 scenes`: Ngăn một hiệu ứng lặp lại ở 2 phân cảnh liên tiếp.

---

## 🗓️ LỘ TRÌNH THỰC HIỆN 7 CẤP ĐỘ (ROADMAP)

- [x] **Priority 1 (Đang làm):** Transition Grammar Engine (Xóa bỏ random slide/circle, áp dụng Hard Cut & Flash Cut).
- [ ] **Priority 2:** Effect Recipes / Combo Stacks (`HOOK_ATTACK`, `PRODUCT_REVEAL`, `PRICE_REVEAL`).
- [ ] **Priority 3:** Velocity Engine (`velocity_hit`, `velocity_ramp`).
- [ ] **Priority 4:** Kinetic Text & Impact Text (`pop_overshoot`, `text_emphasis`).
- [ ] **Priority 5:** Style DNA (Phân biệt nhịp dựng Viral Fast vs Luxury Leather).
- [ ] **Priority 6:** Effect Budget & Cooldown Control.
- [ ] **Priority 7:** Object-Aware Text (Để dành khi nâng cấp Vision Pipeline).
