# 📜 AGENTS & WORKSPACE RULES - AUTO-VIDEO-FACTORY

> **QUY TẮC CỐT LÕI HÀNG ĐẦU (TOP PRIORITY RULES):**
> 
> 1. **LUÔN LUÔN TRAO ĐỔI VÀ THỐNG NHẤT VỚI USER TRƯỚC KHI THỰC HIỆN.**
> 2. **TUYỆT ĐỐI KHÔNG TỰ Ý CHẠY `git push` KHI CHƯA ĐƯỢC USER YÊU CẦU TRỰC TIẾP.**

---

### 1. 🤝 Quy Trình Làm Việc & Thảo Luận (Communication & Planning):
- **Bắt buộc trao đổi trước:** Trước khi chỉnh sửa mã nguồn, thay đổi file cấu hình, hoặc khởi chạy lệnh lớn, AI assistant **bắt buộc phải trình bày giải pháp kỹ thuật và trao đổi với USER trước**.
- **Không tự ý suy đoán:** Nếu có thắc mắc hoặc thông số chưa rõ ràng, luôn hỏi ý kiến USER để thống nhất định hướng.

---

### 2. 🎬 Quy Tắc Dựng Video & Đồ Họa (Video & Graphics Standard):
- **Động cơ Primary Remotion Hybrid:** Visual Layer được dựng bằng Remotion v4 kết hợp FFmpeg Audio Layer bảo đảm độ lệch âm thanh $0.0\text{ms}$ (zero drift) và bảo toàn màu sắc gốc BT.709.
- **Bảo toàn chất lượng phông chữ Tiếng Việt:** $100\%$ phông chữ Tiếng Việt phải có nét sắc mỏng chuẩn Unicode, không tràn lề khung, không lệch góc.
- **Lưu trữ Archive & Đồng bộ:** Sau khi render hoàn tất, luôn đồng bộ kết quả lên Google Sheet, manifest JSON và lưu trữ vào ổ đĩa NAS `/Volumes/Media/Auto-Video-Factory/`.

---

### 3. 🛡️ Quy Tắc Quản Trị Mã Nguồn & Git (Strict Git Governance):
- **Nghiêm cấm tự động đẩy lên Git:** Tuyệt đối KHÔNG được tự ý chạy lệnh `git push` dưới bất kỳ hình thức nào.
- Chỉ được phép commit cục bộ (Local Commit) để lưu tiến độ công việc an toàn trên máy của USER.
- Chỉ đẩy lên remote khi USER gõ lệnh rõ ràng (ví dụ: *"đẩy lên git đi bạn"*).
