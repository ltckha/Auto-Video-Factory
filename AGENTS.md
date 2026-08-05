# 📜 AGENTS & WORKSPACE RULES - AUTO-VIDEO-FACTORY

> **QUY TẮC CỐT LÕI HÀNG ĐẦU (TOP PRIORITY RULE):**
> 
> **LUÔN LUÔN TRAO ĐỔI VÀ THỐNG NHẤT VỚI USER TRƯỚC KHÍ THỰC HIỆN.**

---

### 1. 🤝 Quy Trình Làm Việc & Thảo Luận (Communication & Planning):
- **Bắt buộc trao đổi trước:** Trước khi chỉnh sửa mã nguồn, thay đổi file cấu hình, hoặc khởi chạy lệnh render video, AI assistant **bắt buộc phải trình bày giải pháp kỹ thuật và trao đổi với USER trước**.
- **Xem trước (Preview First):** Khi thử nghiệm hiệu ứng, phông chữ hoặc đồ họa khung, luôn tạo ảnh Preview xem trước để USER đánh giá và duyệt tỷ lệ thị giác trước khi viết code chính thức.
- **Không tự ý suy đoán:** Nếu có thắc mắc hoặc thông số chưa rõ ràng, luôn hỏi ý kiến USER để thống nhất định hướng.

---

### 2. 🎬 Quy Tắc Dựng Video & Đồ Họa (Video & Graphics Standard):
- **Bảo toàn chất lượng phông chữ Tiếng Việt:** 100% phông chữ Tiếng Việt phải có nét sắc mỏng chuẩn Unicode, không tràn lề khung, không lệch góc.
- **Hệ thống pre-composite card:** Giữ nguyên kiến trúc pre-render khung PNG + chữ trong Node.js trước khi overlay lên video bằng FFmpeg.
- **Lưu trữ Archive & Đồng bộ:** Sau khi render hoàn tất, luôn đồng bộ kết quả lên Google Sheet, CSV backup và lưu trữ vào ổ đĩa NAS `/Volumes/Media/Auto-Video-Factory/archive/`.
