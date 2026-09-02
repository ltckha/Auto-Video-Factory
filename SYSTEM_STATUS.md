# BẢN ĐỒ NGỮ CẢNH HỆ THỐNG (SYSTEM STATUS & CONTEXT MAP)

Tài liệu này đóng vai trò là **Bộ nhớ Trạng thái Cục bộ (Local State Memory)** để các AI Assistant (như Gemini, Claude) đọc nhanh mỗi khi khởi động phiên làm việc mới, giúp nắm bắt ngay tình trạng hệ thống mà không cần quét lại toàn bộ mã nguồn.

---

## 1. Tổng quan Dự án
- **Tên dự án:** Auto-Video-Factory (hoặc AI-Video-Factory).
- **Mục tiêu:** Tự động cắt ghép, dựng video ngắn (Short-form, TikTok, Reels) từ video dài hoặc kịch bản thông qua timeline JSON và ffmpeg.
- **Công nghệ chính:** NodeJS (ES6/CommonJS), FFmpeg, FFprobe.
- **Môi trường chạy:** macOS (Apple Silicon), lưu trữ trực tiếp trên thư mục mount Nextcloud (`/Users/khan/Developer/Auto-Video-Factory`).

---

## 2. Các Mốc Chỉnh sửa & Cấu hình Quan trọng (Status: Đang Hoạt Động Tốt)

### 📌 Danh Sách Lệnh Command Gọn Gàng (Executable Commands)
- **`generate.command`:** [generate.command](file:///Users/khan/Developer/Auto-Video-Factory/generate.command) — Phân tích video, chọn mode 5 tầng & sinh kịch bản JSON.
- **`render.command`:** [render.command](file:///Users/khan/Developer/Auto-Video-Factory/render.command) — Dựng video thành phẩm từ kịch bản JSON.
- **`learn.command`:** [learn.command](file:///Users/khan/Developer/Auto-Video-Factory/learn.command) — Học phong cách dựng từ video mẫu.
- **`sync.command`:** [sync.command](file:///Users/khan/Developer/Auto-Video-Factory/sync.command) — Đồng bộ dự án.
- **Quyền hạn:** Tất cả đã được cấp quyền `chmod +x` chuẩn trên macOS.

### 📌 Chuẩn hóa Âm thanh (Audio Normalization)
- **Vị trí:** [render.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/render.js) (hàm `renderScene` và `renderTemporalWarpScene`).
- **Logic hoạt động:**
  - Sử dụng `ffprobe` (`hasAudioStream`) để kiểm tra nếu video gốc không có tiếng, hệ thống tự động chèn luồng âm thanh tĩnh bằng bộ lọc `anullsrc`.
  - Các phân cảnh tua nhanh/chậm (`renderTemporalWarpScene`) tự động chèn thêm silent audio đúng thời lượng thay vì sử dụng `-an` (tắt tiếng).
  - Mục tiêu: Đảm bảo 100% các scene con đầu ra đều chứa track audio chuẩn hóa (AAC, Stereo, 44100Hz, 160k) để ghép nối (`concat`) không bị lỗi.

### 📌 Ghép Voice WAV per-Scene (Voice Audio Injection)
- **Vị trí:** [render.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/render.js) (hàm `resolveVoiceWav` + `renderScene`).
- **Cách hoạt động:** n8n sinh file `.wav` voice cho từng scene và đặt vào thư mục `incoming/` theo quy ước đặt tên `{projectId}_{scene_id}.wav` (ví dụ: `20260708_183534_scene_001.wav`). Trước khi render mỗi scene, hệ thống tự động tìm file WAV tương ứng:
  - **Có WAV** → ghép WAV làm audio track duy nhất (video channel từ mp4, audio channel từ wav), dùng `-shortest` để đồng bộ thời lượng.
  - **Không có WAV + video có audio** → giữ nguyên audio gốc của video.
  - **Không có WAV + video không có audio** → chèn silent audio (`anullsrc`).
- **⚠️ Lưu ý:** Không tự ý sửa logic 3 nhánh này để tránh lỗi mismatch audio khi concat.

### 📌 Tự động Dọn dẹp Tài nguyên (Temp Cleanup)
- **Vị trí:** [render.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/render.js) (hàm `cleanupTempDir`).
- **Logic hoạt động:** Xóa toàn bộ file tạm (`.mp4`, `.txt`, `.txt` phụ đề) ngay sau khi render thành công hoặc thất bại. Chỉ giữ lại thư mục `temp/fontconfig` để tối ưu hóa cache font chữ cho các lần render tiếp theo.

---

## 3. Bản đồ Script NodeJS (`renderer/scripts/`)

| File | Kích thước | Vai trò | Hàm / Logic quan trọng |
| :--- | :---: | :--- | :--- |
| [render.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/render.js) | ~44KB | **Cốt lõi.** Điều phối toàn bộ quy trình render: đọc timeline JSON, dựng lệnh ffmpeg, ghép cảnh (`concat`), quản lý hàng đợi `incoming/` | `renderScene`, `renderTemporalWarpScene`, `hasAudioStream` (chèn `anullsrc`), `cleanupTempDir`, `archiveSuccessfulRender`, `handleProjectFailure` |
| [effects.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/effects.js) | ~28KB | Registry toàn bộ hiệu ứng hình ảnh: zoom, shake, speed ramp, cinematic... Chứa hàm xây dựng tham số filter ffmpeg cho từng effect | `normalizeAdvancedEffect`, `buildEffectArgs`, `ADVANCED_EFFECT_ENUMS` — load động từ `config/effectEnums.json` |
| [effectLearning.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/effectLearning.js) | ~10KB | **Học máy hiệu ứng.** Ánh xạ tên hiệu ứng tùy ý từ AI sang tên hiệu ứng hợp lệ trong registry. Lưu vào `effects/learned_effects.json` | `resolveLearnedAdvancedEffect`, `initializeEffectLearning`, `learnFrequentFallbacksFromLogs`, `matchHeuristic`, `matchSimilarity` |
| [syncPromptEnums.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/syncPromptEnums.js) | ~1KB | Đồng bộ danh sách enum từ `config/effectEnums.json` vào `prompts/timeline_generator_prompt.md`. Chạy: `npm run sync-prompt` | Inject section `ENUM_VALID_VALUES` vào cuối prompt để AI biết các giá trị hợp lệ |
| [subtitleStyles.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/subtitleStyles.js) | ~10KB | Registry toàn bộ kiểu phụ đề: font, màu sắc, border, shadow, vị trí. Tương ứng với các `subtitle_style` trong prompt | `resolveSubtitleStyle`, `normalizeStyleKey` — ánh xạ `hook_bold`, `neon_glow`, `framed_card`, `gold_caption`, `cta_red` |
| [subtitleLayoutEngine.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/subtitleLayoutEngine.js) | ~3.6KB | Tính toán bố cục an toàn (safe zone) để phụ đề không che sản phẩm, tự wrap chữ nếu quá dài | `prepareSubtitleLayout` — tính `safeX`, `safeBottom`, `baseFontSize` theo độ phân giải thực tế |
| [textPositionEngine.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/textPositionEngine.js) | ~0.7KB | Chuẩn hóa giá trị `text_position` đầu vào (`top`, `center`, `bottom`). Fallback về `bottom` nếu giá trị không hợp lệ | `normalizePosition` |
| [fontRegistry.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/fontRegistry.js) | ~3.4KB | Quét và đăng ký font chữ từ hệ thống macOS | `resolveFont` — dùng để ffmpeg tìm font khi vẽ chữ lên video |
| [captionGenerator.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/captionGenerator.js) | ~0.7KB | Sinh nội dung caption/post text từ `video_meta` của timeline JSON để dùng cho mạng xã hội | `buildPostText` — đọc `title`, `description`, `hashtags` từ `video_meta` |
| [archiveWorkflow.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/archiveWorkflow.js) | ~2.3KB | Quản lý vòng đời project sau khi render xong: di chuyển video thành phẩm sang `rendered/` hoặc `failed/`, tạo folder archive có timestamp | `createWorkflowContext`, `archiveSuccessfulRender`, `handleProjectFailure` |
| [google_apps_script.js](file:///Users/khan/Developer/Auto-Video-Factory/renderer/scripts/google_apps_script.js) | ~7.3KB | Mã Google Apps Script tự động tạo Dashboard trên Google Sheet (Tab Projects Tracker, Scenes Detail, Effects Analytics) | `doPost`, `ensureSheetsAndHeaders`, `updateProjectTracker` |

**Config file:**
| [effectEnums.json](file:///Users/khan/Developer/Auto-Video-Factory/renderer/config/effectEnums.json) | ~0.5KB | **Single Source of Truth** cho toàn bộ enum của `advanced_effect` | Được `effects.js` load động và `syncPromptEnums.js` dùng để inject vào prompt |

> [!NOTE]
> **Luồng thực thi cơ bản:** `render.js` → đọc `incoming/*.json` → gọi `effects.js` + `effectLearning.js` để dịch hiệu ứng → gọi `subtitleStyles.js` + `subtitleLayoutEngine.js` + `fontRegistry.js` để dựng subtitle → thực thi `ffmpeg` → dọn dẹp tạm bằng `cleanupTempDir` → lưu kết quả bằng `archiveWorkflow.js`.

---

## 4. Hệ thống Prompt AI & n8n Integration

Toàn bộ các Prompt System phục vụ cho việc tích hợp n8n được lưu trữ tập trung tại thư mục `renderer/prompts/`:

| File Prompt | Nhiệm vụ | Bản Backup |
| :--- | :--- | :--- |
| [timeline_generator_prompt.md](file:///Users/khan/Developer/Auto-Video-Factory/renderer/prompts/timeline_generator_prompt.md) | Nhận diện/Cắt cảnh, gán hiệu ứng chữ & chuyển cảnh tạo JSON Timeline | [timeline_generator_prompt.v1.md](file:///Users/khan/Developer/Auto-Video-Factory/renderer/prompts/backups/timeline_generator_prompt.v1.md) |
| [video_style_learning_prompt.md](file:///Users/khan/Developer/Auto-Video-Factory/renderer/prompts/video_style_learning_prompt.md) | Phân tích phong cách dựng từ video mẫu | [video_style_learning_prompt.v1.md](file:///Users/khan/Developer/Auto-Video-Factory/renderer/prompts/backups/video_style_learning_prompt.v1.md) |
| [render_analyzer_prompt.md](file:///Users/khan/Developer/Auto-Video-Factory/renderer/prompts/render_analyzer_prompt.md) | QA/Rà soát và tối ưu hóa JSON Timeline trước khi render | [render_analyzer_prompt.v1.md](file:///Users/khan/Developer/Auto-Video-Factory/renderer/prompts/backups/render_analyzer_prompt.v1.md) |

---

---

## 6. Thư Mục Quản Lý Ý Tưởng & Lộ Trình (Ideas Backlog)
- [ideas/INDEX.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/INDEX.md): Bảng quản lý tổng hợp trạng thái các ý tưởng & tính năng đang nghiên cứu/triển khai.
- [ideas/IDEA_001_long_video_and_multi_clips.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_001_long_video_and_multi_clips.md): Spec chi tiết cho ý tưởng **IDEA-001** (Xử lý video dài >5m & Ghép chùm clips ngắn).
- [ideas/IDEA_002_copyright_safe_audio_and_bgm.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_002_copyright_safe_audio_and_bgm.md): Spec chi tiết cho ý tưởng **IDEA-002** (Hệ thống âm thanh 3 tầng & Nhạc nền an toàn bản quyền).
- [ideas/IDEA_003_dynamic_overlay_stickers.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_003_dynamic_overlay_stickers.md): Spec chi tiết cho ý tưởng **IDEA-003** (🔄 Đã hợp nhất vào IDEA-007).
- [ideas/IDEA_005_ai_hybrid_dream_hook.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_005_ai_hybrid_dream_hook.md): Spec chi tiết cho ý tưởng **IDEA-005** (Pipeline Video AI Hybrid: Quay thật + Cảnh AI Dream Hook 3s).
- [ideas/IDEA_006_intent_driven_micro_effects.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_006_intent_driven_micro_effects.md): Spec chi tiết cho ý tưởng **IDEA-006** (Intent-Driven Editing & Micro-Effects Engine CapCut/TikTok 2026).
- [ideas/IDEA_007_dynamic_subtitle_typography.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_007_dynamic_subtitle_typography.md): Spec chi tiết cho ý tưởng **IDEA-007** (Next-Gen Dynamic Subtitle Typography, Badges & Overlay Stickers Engine).
- [ideas/IDEA_011_gemini_file_uri_cache_and_reuse.md](file:///Users/khan/Developer/Auto-Video-Factory/ideas/IDEA_011_gemini_file_uri_cache_and_reuse.md): Spec chi tiết cho ý tưởng **IDEA-011** (Lưu Gemini File URI để tái sử dụng phân tích).
- [effects/EFFECTS_BACKLOG_AND_FEEDBACK.md](file:///Users/khan/Developer/Auto-Video-Factory/effects/EFFECTS_BACKLOG_AND_FEEDBACK.md): Danh mục Tổng Kho Hiệu Ứng & Phân Loại Duyệt Tác Vụ.

---

## 7. 🛡️ NGUYÊN TẮC CỐT LÕI CỦA AI ASSISTANT (STRICT RULES)
1. ⚠️ **BẮT BUỘC THẢO LUẬN TRƯỚC KHI LÀM:** Tuyệt đối KHÔNG tự ý viết code, sửa code hay can thiệp hệ thống khi chưa thảo luận và nhận được sự phê duyệt rõ ràng từ User.
2. ⚠️ **KHÔNG TỰ Ý PUSH GIT:** Chỉ thực hiện `git push` hoặc `git commit` khi User trực tiếp yêu cầu trong câu lệnh của lượt tương tác đó.







