# IDEA-011: Lưu Trữ File URI Gemini Để Tái Sử Dụng Khi Cần Tạo Lại Kịch Bản

**Ngày tạo:** 01/09/2026  
**Trạng thái:** 💡 **Đang Nghiên Cứu (Researching / Backlog)**  
**Hạng mục:** Tối ưu hóa API & Trải nghiệm Người dùng (API Optimization & Creator UX)

---

## 1. Bối Cảnh & Vấn Đề

* Khi người dùng chạy `generate.command` để đưa một video lên Gemini AI phân tích, video được upload lên máy chủ Google Gemini File API (mất thời gian upload và chờ xử lý encode).
* Sau khi AI sinh kịch bản JSON, nếu người dùng cảm thấy góc tiếp cận hoặc kịch bản chưa thực sự ưng ý và muốn chạy lại để thử góc sáng tạo khác:
  * Hệ thống hiện tại xóa ngay file tạm sau khi chạy xong.
  * Khi chạy lại, người dùng phải chịu thêm một lần upload từ đầu và chờ đợi xử lý lại cùng một video gốc.

---

## 2. Giải Pháp Đề Xuất (Smart File URI Cache)

1. **Lưu Cache Cục Bộ (48 Giờ):**
   * Lưu thông tin mapping giữa `video_path (hash/stat)` và `Gemini File URI / Name` vào file cache cục bộ (ví dụ: `renderer/cache/gemini_file_cache.json`).
   * Theo chính sách của Google Gemini File API, file tải lên được giữ tự động trong **48 giờ** trước khi bị máy chủ tự động xóa.
2. **Kiểm Tra & Tái Sử Dụng (0 Giây Upload):**
   * Khi người dùng chạy lại video đó: Hệ thống kiểm tra xem file trên Gemini còn trạng thái `ACTIVE` không.
   * Nếu còn hiệu lực: Bỏ qua bước upload và nhảy thẳng vào bước gợi ý ý tưởng / phân tích kịch bản.
3. **Tiết Kiệm Băng Thông & Thời Gian:**
   * Giúp người dùng thoải mái thử nghiệm nhiều góc dựng khác nhau mà không phải chờ đợi upload lại video nặng nhiều lần.

---

## 3. Kế Hoạch Triển Khai (Khi Được Duyệt)

* **Module:** `geminiFileCache.js` trong `renderer/scripts/`.
* **Cơ chế:**
  * `getCachedFile(ai, filePath)`: Kiểm tra hash và xác thực trạng thái remote file.
  * `setCachedFile(filePath, uploadResult)`: Ghi nhận URI mới khi có video mới.
  * Giữ file trong 48h thay vì xóa tức thì trong `finally` block của `generateTimeline.js`.
