# IDEA-005: Pipeline Video AI Hybrid (Quay Thật + Cảnh AI Bối Cảnh Trải Nghiệm "Dream Hook")

> ⚠️ **Trạng thái:** 💡 ĐANG NGHIÊN CỨU (RESEARCHING)  
> **Mã ID:** IDEA-005  
> **Ngày tạo:** 2026-07-29  

---

## 🎯 1. Đặt Vấn Đề & Mục Tiêu

### Vấn Đề
* Video quay thực tế thô (Unboxing / Cầm trên tay) có **độ tin cậy cực cao**, nhưng 3 giây đầu thường bị nhàm chán (chỉ thấy túi nilon, thùng carton, phòng quay tối...) khiến người xem lướt qua ngay.
* Nếu chỉ dùng video AI thì người xem cảm thấy "ảo quá", thiếu niềm tin mua hàng.

### Giải Pháp (AI Hybrid Pipeline)
Kết hợp công thức chiến thắng:  
`[00:00 - 00:03]: Video AI Dream Hook (Kết quả hoàn hảo giữ chân 3s đầu)`  
`+ [00:03 - 00:08]: Video Thật Đã Qua Lọc Cảnh Rác (Chứng minh hàng thật)`  
`+ [00:08 - 00:10]: Call To Action (Kích thích bấm giỏ hàng)`

---

## 🏗️ 2. Quy Trình 4 Bước Triển Khai Trong Hệ Thống

```
[Video Quay Thật Thô] ──> [Pass 1: Gemini Lọc Cảnh Đẹp Nhất (Skip rác)]
                                  │
                                  ├─> [Pass 2: Gemini Sinh Prompt "Dream Hook" Kết Quả 3s]
                                  │           │
                                  │           ▼
                                  │     [Pass 3: Render Clip AI 3s]
                                  │           │
                                  ▼           ▼
                     [Pass 4: Auto-Video-Factory Ghép Hybrid]
                     (AI Dream Hook 3s + Video Thật 5s + CTA)
```

---

## 🛠️ 3. Chi Tiết Kỹ Thuật Dự Kiến

### Pass 1: Lọc Cảnh Thật Đắt Giá (`smartRawClipFilter.js`)
- Gemini AI quét toàn bộ video quay thô.
- Bỏ qua các mốc rác (rọc băng keo, tháo xốp, góc mờ nhòe).
- Chỉ giữ lại mốc 3-5s đẹp nhất (ví dụ: góc cầm sản phẩm cận cảnh sắc nét).

### Pass 2: Gemini Tạo Prompt "Dream Hook" (`dreamHookPromptGen.js`)
- Gemini nhìn sản phẩm thật và tự tưởng tượng ra **"Kết Quả Ước Mơ (Dream Outcome)"** của người dùng khi trải nghiệm sản phẩm.
- *Ví dụ 1 (Vòi sen):* Dream Hook = "Cảnh vòi sen inox phun luồng nước sương mù cực mạnh trong phòng tắm kính mờ sang trọng".
- *Ví dụ 2 (Máy làm bánh):* Dream Hook = "Cảnh chiếc bánh Waffle vàng ươm tỏa khói nghi ngút được rưới mật ong óng ả".

### Pass 3: Render Clip AI 3 Giây Mở Đầu
- Gửi Prompt Dream Hook sang Gemini Video API để render 3s video AI siêu cuốn hút (`dream_hook.mp4`).

### Pass 4: Ghép Nối & Phối Âm Tự Động (`render.js`)
- **Khung thời lượng:**  
  - `00:00 - 00:03`: Clip AI Dream Hook (BGM **85%** bùng nổ, Text effect `Pop-up` gây chú ý).
  - `00:03 - 00:08`: Clip Video Thật đã qua lọc (BGM **50%** hoặc giữ tiếng động thật ASMR).
  - `00:08 - 00:10`: Cảnh Call To Action (Hiệu ứng `cta_red` mượt mà).

---

## 📌 4. Lý Do Hướng Hybrid Đạt Tỷ Lệ Chuyển Đổi (CR) Cao Nhất
1. **3s Đầu (Hook):** Thỏa mãn thị giác, kích thích Dopamine nhờ vẻ đẹp mơ ước của AI.
2. **5s Tiếp (Proof):** Đập tan nghi ngờ của khách hàng bằng hình ảnh sản phẩm thật và tay người thật.
3. **2s Cuối (CTA):** Thúc đẩy quyết định bấm vào giỏ hàng ngay lập tức.
- **Ngách tối ưu:** Đồ gia dụng, Thiết bị bếp, Đồ dùng DIY, Cây cảnh/Nông nghiệp, Mỹ phẩm chăm sóc da.
