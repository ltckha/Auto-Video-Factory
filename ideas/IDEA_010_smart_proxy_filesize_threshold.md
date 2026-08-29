# IDEA-010: Tối Ưu Smart Proxy 1x Dựa Trên Ngưỡng Dung Lượng File (>200MB)

> 💡 **Trạng thái:** 📝 ĐÃ DUYỆT Ý TƯỞNG / SẴN SÀNG TRIỂN KHAI  
> **Mã ID:** IDEA-010  
> **Ngày tạo:** 2026-08-24  

---

## 📌 Bối Cảnh & Nỗi Đau Thực Tế

1. **Video Quay 4K / High Bitrate (Thời lượng ngắn nhưng dung lượng cực nặng):**  
   Nhiều video quay từ iPhone 15 Pro, Xiaomi 15T Pro hoặc máy ảnh Sony dù chỉ dài 1-3 phút nhưng quay ở chế độ 4K 60fps/HDR có dung lượng từ **300MB đến hơn 1GB**.
2. **Nghẽn Băng Thông & Tốn Thời Gian Upload File API:**  
   Nếu upload trực tiếp file gốc > 200MB lên Gemini File API:
   - Tốn thời gian tải lên (mất từ 30s đến 2 phút tùy tốc độ mạng).
   - Tăng thời gian chờ Gemini xử lý ở trạng thái `PROCESSING`.
3. **Nhu Cầu Đồng Bộ Giữa Thời Lượng & Dung Lượng:**  
   Cần kết hợp cả 2 điều kiện: **Thời lượng > 5 phút (300s)** HOẶC **Dung lượng > 200MB** để tự động kích hoạt nén Smart Proxy 1x 720p siêu nhẹ (~30-50MB) bằng chip Apple M4 trong 3-5 giây.

---

## 🛠️ Giải Pháp Thiết Kế Kỹ Thuật

### 1. Phân Tích Kép (Duration & File Size Profile)
- Lấy thời lượng: `getVideoDuration(absoluteVideoPath)`
- Lấy dung lượng file: `fs.statSync(absoluteVideoPath).size / (1024 * 1024)` (MB).

### 2. Kích Hoạt Smart Proxy 1x 720p Thông Minh
- **Điều kiện kích hoạt:**
  ```javascript
  const shouldCreateProxy = isClusterMode || dur > 300 || fileSizeMB > 200;
  ```
- **Cam kết kỹ thuật của Smart Proxy 1x:**
  * Nén 720p siêu tốc bằng chip Apple M4 (`scale=-2:720`, `preset ultrafast`).
  * Giữ **100% tốc độ 1x chuẩn và âm thanh tiếng nói gốc** (không méo tiếng, không giật lag).
  * Đảm bảo mốc thời gian `start_s` và `end_s` **khớp 100.0%** với video gốc.

---

## 📝 Nhật Ký Cập Nhật Trạng Thái (Status History)

- **24/08/2026:** Khởi tạo ý tưởng theo yêu cầu tối ưu hiệu năng và băng thông upload Gemini File API.
