# IDEA-004: Pipeline Generative Video AI Pure (Từ 1 Ảnh Shopee -> Meta-Prompt Director -> Video AI Điện Ảnh)

> ⚠️ **Trạng thái:** 💡 ĐANG NGHIÊN CỨU (RESEARCHING)  
> **Mã ID:** IDEA-004  
> **Ngày tạo:** 2026-07-29  

---

## 🎯 1. Đặt Vấn Đề & Mục Tiêu

### Vấn Đề
* Creator / Nhà bán hàng Affiliate có hàng trăm sản phẩm trên Shopee/TikTok nhưng **không có sản phẩm mẫu thật trên tay** để quay video.
* Nhập mô tả sản phẩm quá rườm rà vào AI Video Gen thường gây ra lỗi "over-prompting" (AI bị rối bối cảnh, vẽ chữ nhòe, chuyển động kỳ dị).

### Giải Pháp (AI Pure Pipeline)
Tự động hóa hoàn toàn quy trình chuyển từ **1 Ảnh Chụp Sản Phẩm Shopee/Studio + Mô Tả Kỹ Thuật** thành một Video Quảng Cáo Điện Ảnh Bắt Mắt.

---

## 🏗️ 2. Kiến Trúc Kỹ Thuật Dự Kiến

```
[1 Ảnh Shopee + Mô tả Shopee]
       │
       ▼
[Mô-đun Meta-Prompt Director] ──> Chắt lọc 1 USP chính -> Tạo Prompt Tiếng Anh (3-4 câu)
       │
       ▼
[Gemini Video API / Omni Gen]  ──> Xuất clip chuyển động 3-5 giây (Chất lượng 1080p)
       │
       ▼
[Render Engine Auto-Video-Factory] ──> Ghép Subtitle + BGM (50%) + SFX + Voiceover -> Video Thành Phẩm
```

---

## 🛠️ 3. Quy Trình 4 Bước Chi Tiết

### Bước 1: Meta-Prompt Director (`metaPromptDirector.js`)
- Gemini AI đóng vai trò Đạo Diễn Thị Giác: Đọc mô tả Shopee tiếng Việt rườm rà, cô đọng lại đúng **1 Điểm Đắt Giá Nhất (USP)** của sản phẩm.
- Tự động dịch và viết **Prompt Tiếng Anh tối giản (3-4 câu)** theo chuẩn công thức:
  `[Product Image Ref] + [Key Action/Transformation] + [Camera Motion] + [Cinematic Lighting/Environment]`

### Bước 2: Sinh Video AI Chuyển Động (`generateAIVideo.js`)
- Đưa Ảnh sản phẩm + Prompt chuẩn sang API Video Generation (Gemini Omni / Imagen Video).
- Xuất ra file video ngắn `ai_product_motion.mp4` (3-5 giây) có bối cảnh và ánh sáng điện ảnh chuyên nghiệp.

### Bước 3: Tạo Subtitle & Kịch Bản Voiceover
- Gemini tự sinh 1-2 câu kịch bản ngắn reaction/chia sẻ trải nghiệm chân thực.
- Gán kiểu phông chữ phụ đề `framed_card` hoặc `gold_caption` nổi bật.

### Bước 4: Tự Động Phối Âm & Xuất Video
- Nạp video AI vào `render.js`.
- Chèn BGM ở mức âm lượng mặc định **`50%`**, chèn SFX (`swoosh`, `pop`) khớp góc máy và xuất file thành phẩm.

---

## 📌 4. Ưu Điểm & Ngách Ứng Dụng
- **Ưu điểm:** Sản xuất video hàng loạt không tốn công quay chụp, không tốn chi phí mua mẫu thật.
- **Ngách tối ưu:** Thời trang, Phụ kiện, Mỹ phẩm cao cấp, Đồ Decor phòng, Đồ công nghệ Branding.
