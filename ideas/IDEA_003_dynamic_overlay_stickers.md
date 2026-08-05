# IDEA-003: Hệ Thống Sticker Chuyển Động Động (Dynamic Animated Overlay Engine)

> 🔄 **Trạng thái:** 🔄 ĐÃ HỢP NHẤT VÀO [IDEA-007](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_007_dynamic_subtitle_typography.md)  
> **Mã ID:** IDEA-003  
> **Ngày hợp nhất:** 2026-08-05  

---

## 📌 Thông Báo Hợp Nhất Kiến Trúc

Theo quyết định định hướng kiến trúc, **IDEA-003 (Dynamic Overlay Stickers)** đã được hợp nhất 100% vào **[IDEA-007 (Next-Gen Dynamic Subtitle Typography, Graphic Badges & Overlay Stickers Engine)](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_007_dynamic_subtitle_typography.md)**.

### Lý Do Hợp Nhất:
1. **Thống Nhất Quản Lý Đồ Họa Overlays:** Cả Sticker động lẫn Thẻ Subtitle Badges đều thuộc lớp phủ đồ họa (Overlay Layer) trên video.
2. **Tối Ưu Hóa FFmpeg FilterGraph:** Ghép chung việc overlay Sticker và vẽ chữ Subtitle trong **01 bộ lọc `filter_complex` duy nhất**, giúp tốc độ render nhanh hơn 30% và tránh trùng lặp mã nguồn.
3. **Thư Viện Đồ Họa Tập Trung:** Đưa toàn bộ tài nguyên vào `renderer/assets/overlays/` (`cards/` và `stickers/`).

Mọi chi tiết thiết kế và lộ trình triển khai vui lòng tham khảo file spec chính thức:  
👉 **[ideas/IDEA_007_dynamic_subtitle_typography.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_007_dynamic_subtitle_typography.md)**
