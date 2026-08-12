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

## 🛠️ Giải Pháp Thiết Kế Kỹ Thuật (Smart Multi-Short Cluster Engine + Human-in-the-Loop)

### 1. Kéo Thả Multi-Input & FFmpeg Lossless Concat
- Hỗ trợ kéo thả 1 Thư mục Folder HOẶC kéo thả nhiều file `.mp4` cùng lúc.
- FFmpeg chạy `ffmpeg -f concat -c copy` ghép nhanh các clip thô thành `combined_master.mp4` trong 1 giây mà không giảm độ nét.
- Đánh dấu mốc ranh giới nối clip (`clip_boundaries`).

### 2. Smart Fast-Preview Generator
- Nếu video $> 5$ phút, tự động tua $4x$ nén 15fps thành `fast_preview.mp4` siêu nhẹ (5-10MB) gửi sang Gemini 3.6 Flash File API.

### 3. Semantic Highlight Clustering (Pass 1 - AI Editor Brain)
- Gemini lọc bỏ 100% cảnh rác/chán.
- Trích xuất các khoảnh khắc đắt giá (Highlights).
- Đề xuất các **Chùm Kịch Bản (Clusters)** ban đầu kèm mốc thời gian và tiêu đề nội dung.

### 4. Interactive Human Review & Edit (Con Người Làm Chủ Mốc Thời Gian & Nội Dung) 🌟
- Dừng lại tại màn hình Terminal sau Pass 1 để hiển thị danh sách các Short đề xuất.
- Có đếm ngược 10 giây: Nếu người dùng không nhập gì, hệ thống tự động chốt theo đề xuất AI và tiếp tục.
- Cho phép người dùng chọn **Option [2]** để tinh chỉnh:
  - **Sửa mốc thời gian (Timestamps):** Thay đổi `01:15-02:30` thành `01:05-02:40`.
  - **Sửa tiêu đề & định hướng nội dung:** Đổi tên hoặc bổ sung góc nhìn truyền thông mong muốn.
  - **Xóa / Lọc bớt Short:** Bỏ các đoạn không muốn dựng.

### 5. Pass 2: Deep Timeline Generation & Batch Multi-Render Engine
- Gemini nhận mốc thời gian và định hướng nội dung đã được con người chốt/tối ưu.
- Xuất mảng các file JSON kịch bản: `{projectId}_short01.json`, `{projectId}_short02.json`...
- Tự động sao chép video mp4 nguồn tương ứng sang `incoming/{projectId}_short01.mp4`.
- `render.js` tự động lặp render toàn bộ danh sách, chèn hiệu ứng chuyển cảnh mượt tại các điểm nối clip, chèn BGM (50% - 85%) và đồng bộ Google Sheet!

---

## 📝 Nhật Ký Cập Nhật Trạng Thái (Status History)

- **27/07/2026:** Khởi tạo ý tưởng (💡 Draft & Research).
- **08/03/2026:** Thống nhất tư duy thiết kế Smart Multi-Short Cluster Engine & Chuyển trạng thái sang 🚧 **Đang Triển Khai**.
- **10/08/2026:** Thảo luận và thống nhất nâng cấp mô hình **Human-in-the-Loop**: Cho phép con người Review, chỉnh sửa mốc thời gian & tiêu đề nội dung trước khi render.
