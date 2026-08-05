# IDEA-001: Xử Lý Video Dài (>5m) & Ghép Chùm Clips Ngắn (Batch Clips)

> ⚠️ **Trạng thái:** 🚧 ĐANG TRIỂN KHAI (IN PROGRESS)  
> **Mã ID:** IDEA-001  
> **Ngày tạo:** 2026-07-27  
> **Ngày cập nhật:** 2026-08-03  

---

## 📌 Bối Cảnh & Nỗi Đau Thực Tế

1. **Video Gốc Quá Dài (> 5 đến 30+ phút):**  
   Đưa trực tiếp file video dài vào Gemini File API dễ làm phản hồi chậm, tốn băng thông và AI dễ bị ảo tưởng timestamp (hallucination) hoặc bỏ sót khoảng thời gian hay nhất ở giữa.
2. **Bộ Nhiều Clips Ngắn Cùng 1 Dự Án (Batch Clips):**  
   Khi đi quay bằng điện thoại, người dùng tạo ra 5–15 clip thô con (`CLIP_001.mp4`, `CLIP_002.mp4`...). Hệ thống cần nhận linh hoạt cả kéo thả Folder lẫn kéo thả nhiều file MP4.
3. **Nhu Cầu Sinh Nhiều Video Ngắn Tối Ưu:**  
   Người dùng muốn từ 1 nguồn vào $\rightarrow$ AI tự động lọc sạch cảnh rác, tự động nhóm các phân đoạn hay có tính liên kết chủ đề lại với nhau $\rightarrow$ Xuất ra **3 đến 5 Video Ngắn Viral hoàn chỉnh** cùng lúc.

---

## 🛠️ Giải Pháp Thiết Kế Kỹ Thuật (Smart Multi-Short Cluster Engine)

### 1. Kéo Thả Multi-Input & FFmpeg Lossless Concat
- Hỗ trợ kéo thả 1 Thư mục Folder HOẶC kéo thả nhiều file `.mp4` cùng lúc.
- FFmpeg chạy `ffmpeg -f concat -c copy` ghép nhanh các clip thô thành `combined_master.mp4` trong 1 giây mà không giảm độ nét.
- Đánh dấu mốc ranh giới nối clip (`clip_boundaries`).

### 2. Smart Fast-Preview Generator
- Nếu video $> 5$ phút, tự động tua $4x$ nén 15fps thành `fast_preview.mp4` siêu nhẹ (5-10MB) gửi sang Gemini 3.6 Flash File API.

### 3. Semantic Highlight Clustering (Pass 1 - AI Editor Brain)
- Gemini lọc bỏ 100% cảnh rác/chán.
- Trích xuất các khoảnh khắc đắt giá (Highlights).
- Tự động gom các đoạn ngắn (5s-8s) hoặc các đoạn có liên kết nội dung thành các **Chùm Kịch Bản (Clusters)**:
  - *Cluster 1:* Segment 1 (5s) + Segment 2 (12s) $\rightarrow$ Short #1 (17s).
  - *Cluster 2:* Segment 3 (28s) $\rightarrow$ Short #2 (28s).
  - *Cluster 3:* Segment 4 (8s) + Segment 5 (15s) $\rightarrow$ Short #3 (23s).

### 4. Batch Multi-Render Engine
- Xuất mảng các file JSON kịch bản: `{projectId}_short01.json`, `{projectId}_short02.json`, `{projectId}_short03.json`.
- `render.js` tự động lặp render toàn bộ danh sách, chèn hiệu ứng chuyển cảnh mượt tại các điểm nối clip, chèn BGM (50% - 85%) và đồng bộ Google Sheet!

---

## 📝 Nhật Ký Cập Nhật Trạng Thái (Status History)

- **27/07/2026:** Khởi tạo ý tưởng (💡 Draft & Research).
- **08/03/2026:** Thống nhất tư duy thiết kế Smart Multi-Short Cluster Engine & Chuyển trạng thái sang 🚧 **Đang Triển Khai**.
