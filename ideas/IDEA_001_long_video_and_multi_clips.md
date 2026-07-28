# IDEA-001: Xử Lý Video Dài (>5m) & Ghép Chùm Clips Ngắn (Batch Clips)

> ⚠️ **Trạng thái:** 💡 ĐANG NGHIÊN CỨU (RESEARCHING)  
> **Mã ID:** IDEA-001  
> **Ngày tạo:** 2026-07-27  

---

## 📌 Bối Cảnh & Nỗi Đau Thực Tế

1. **Video Gốc Quá Dài (> 5 đến 30+ phút):**  
   Đưa trực tiếp file video dài vào Gemini File API dễ làm phản hồi chậm, tốn băng thông và AI dễ bị ảo tưởng timestamp (hallucination) hoặc bỏ sót khoảng thời gian hay nhất ở giữa.
2. **Bộ Nhiều Clips Ngắn Cùng 1 Dự Án:**  
   Khi đi quay bằng điện thoại, người dùng tạo ra 5–10 clip con (`CLIP_001.mp4`, `CLIP_002.mp4`...). Hiện tại hệ thống chỉ nhận 1 file MP4 duy nhất.

---

## 🛠️ Giải Pháp Thiết Kế Kỹ Thuật

### 1. Giải Pháp Cho Video Dài: Smart Fast-Preview & Highlight Chunking
- **FFmpeg Pre-Sampling:** Nếu thời lượng $> 5$ phút, tự động tạo 1 video xem nhanh tốc độ $3x-4x$ hoặc rút trích keyframes trong 3–5 giây.
- **Highlight Cluster Detection:** Gemini AI quét Fast Preview nhẹ để khoanh vùng các cụm điểm sáng đắt giá (`Cluster 1: 01:15-02:30`, `Cluster 2: 07:10-08:45`).
- **Sinh Timeline Sắc Nét:** Gemini cắt ghép các cụm điểm sáng thành kịch bản JSON 30s-90s.

### 2. Giải Pháp Cho Nhiều Clip Ngắn: Auto-Stream Concat & Batch Pipeline
- **Terminal Multi-Input:** Cho phép kéo thả cùng lúc nhiều file hoặc kéo thả 1 Folder clips.
- **Lossless Concat:** FFmpeg chạy `ffmpeg -f concat -c copy` ghép các clip thành `COMBINED_PROJECT.mp4` chỉ trong 1 giây.
- **Bridge Transitions:** Gemini tự động chèn hiệu ứng chuyển cảnh mượt (`wipe_left`, `slide_up`, `circle_open`, `fade`) ngay tại các mốc nối clip.

---

## 📝 Nhật Ký Cập Nhật Trạng Thái (Status History)

- **27/07/2026:** Khởi tạo ý tưởng (💡 Draft & Research).
