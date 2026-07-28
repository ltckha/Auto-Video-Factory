# IDEA-002: Hệ Thống Âm Thanh Đa Tầng & Nhạc Nền An Toàn Bản Quyền (Triple-Audio Layer Engine)

> ⚠️ **Trạng thái:** ✅ HOÀN THÀNH (COMPLETED)  
> **Mã ID:** IDEA-002  
> **Ngày tạo:** 2026-07-27  
> **Ngày hoàn thành:** 2026-07-28  

---

## 📌 Bối Cảnh & Nỗi Đau Thực Tế

1. **Thiếu Âm Thanh Nền (BGM/SFX) Giảm 50-70% Tương Tác:**  
   Video ngắn (TikTok, Reels, Shorts) nếu thiếu nhạc nền hoặc tiếng động hiệu ứng sẽ trở nên khô khan, khó giữ chân người xem.
2. **Nỗi Đau Bản Quyền (Copyright Strike / Mute):**  
   Sử dụng nhạc thương mại bị hệ thống nhận diện Content ID của TikTok/YouTube gỡ tiếng, bóp tương tác hoặc khóa kênh.

---

## 🛠️ Giải Pháp Kỹ Thuật Đỉnh Cao (Mô Hình Hybrid)

### 1. Kiến Trúc Âm Thanh 3 Tầng (Triple-Audio Layer Engine)
- **Tầng 1 (Voice / Voiceover):** Luồng âm thanh lời thoại (giọng đọc WAV hoặc audio gốc) được ưu tiên hàng đầu (100% Volume).
- **Tầng 2 (Royalty-Free BGM):** Nhạc nền an toàn bản quyền phân loại theo Mood (`effects/audio/bgm/`).
- **Tầng 3 (Action SFX):** Hiệu ứng âm thanh ngắn (`swoosh.mp3`, `pop.mp3`, `click.mp3`...) trùng khớp với hiệu ứng visual/chuyển cảnh.

### 2. 3 Kỹ Thuật Xử Lý Âm Thanh "Đẳng Cấp Studio"
1. **Auto-Ducking Engine (Tự Động Đè/Nâng Âm Lượng):**  
   Sử dụng bộ lọc FFmpeg `sidechaincompress` hoặc `volume` envelope:
   - Khi có lời thoại $\rightarrow$ Nhạc nền tự động dịu xuống **15% - 20%**.
   - Khi lời thoại dừng giữa các câu $\rightarrow$ Nhạc nền tự động trỗi dậy **35% - 40%**.
2. **SFX Beat-Sync Engine (Tiếng Động Theo Khung Hình):**  
   Tự động chèn tiếng `swoosh` (khi chuyển cảnh `wipe`/`slide`) hoặc `pop` (khi text nổ `Pop-up`) để tăng trải nghiệm giác quan.
3. **Micro Pitch/Tempo Shift (Màng Bảo Vệ Bản Quyền):**  
   Tự động đẩy nhẹ $+0.5\%$ nhịp/pitch qua bộ lọc `rubberband` / `asetrate` của FFmpeg. Tai người nghe giữ nguyên 99.9% độ hay nhưng bẻ lái thuật toán Content ID.

---

## 📂 Cơ Chế Lưu Trữ & Vận Hành (Hybrid Model)

- **Cốt Lõi 95% (Local Curated Library):**  
  Tạo sẵn kho nhạc tinh tuyển local:
  - `effects/audio/bgm/energetic/`
  - `effects/audio/bgm/luxury/`
  - `effects/audio/bgm/chill/`
  - `effects/audio/sfx/`
- **Mở Rộng 5% (URL Auto-Download):**  
  Cho phép dán link URL bài nhạc mới ngoài kho để tự động tải ngầm qua `yt-dlp` ghép vào video.

---

## 📝 Nhật Ký Cập Nhật Trạng Thái (Status History)

- **27/07/2026:** Khởi tạo ý tưởng (💡 Draft & Research).
