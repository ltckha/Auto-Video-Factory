# 🎬 AUTO-VIDEO-FACTORY - AI IMPLEMENTATION PLAN

> **Trạng thái hiện tại:** `PHASE M6.2 — REAL PRODUCTION & PROGRESSIVE DESIGN EXPANSION (ACTIVE 🟢)`  
> **Tài liệu đặc tả chính thức & Nhật ký:** Xem [`PHASE_M6_2_CHARTER.md`](PHASE_M6_2_CHARTER.md)

---

## 🗺️ LỘ TRÌNH TỔNG THỂ (ROADMAP STATUS)

```text
[✓] R0–R3 : Foundation & Stress Matrix 10/10       — PASS ✅
[✓] M1    : Remotion Design Layer v1              — PASS ✅
[✓] M2    : Design System Foundation (Tokens)     — PASS ✅
[✓] M3    : Motion Registry (Primitives)          — PASS ✅
[✓] M4    : Visual Identity & Brand DNA Catalog   — PASS ✅
[✓] M5    : Production Validation & A/B Benchmark — PASS ✅
[✓] M5.5  : Production Gate & AI Fuzzing Audit    — PASS 100% [GO 🟢]
[✓] M6.0  : Architecture & Production Freeze      — PASS ✅
[✓] M6.1  : Batch Harness & Manifest Generator    — PASS ✅
[🟢] M6.2 : Real Production & Progressive Design   — ĐANG CHẠY (ACTIVE 🟢)
    ├─ [✓] Core Design Kit Tier 1 (4 Styles + Badges + Overlays)
    ├─ [✓] Google Fonts Embedded (Playfair, Paytone One, Montserrat)
    ├─ [✓] Phase M6.2-LK (Legacy Knowledge Migration: 231 Mappings + Stats)
    ├─ [✓] Dynamic Learned Styles Ingestion (Continuous Daily Learning)
    ├─ [✓] End-to-End Post-Render (NAS Sync + Google Sheets + Cleanup)
    ├─ [✓] Native Scene Audio Slicing & Chained atempo Speed Parity
    ├─ [✓] Dynamic BGM Volume Ducking (25% Voiceover / 50% Normal / 85% Fast)
    ├─ [✓] True-Color BT.709 Bitstream Tagging (Bảo toàn màu sắc gốc 100%)
    ├─ [✓] Compact File Size Optimization (CRF=20 chuẩn nén Render cũ)
    └─ [🟢] Continuous Real Video Production & Progressive Tier 2 Expansion
[🔒] M6.3 : Human Visual & Technical Audit        — CHỜ NGHIỆM THU
[🔒] M6.4 : Reliability & Recovery Resilience     — CHỜ NGHIỆM THU
[🔒] M6.5 : Controlled Hybrid Default             — CHỜ NGHIỆM THU
[🔒] M6.6 : Final Production Acceptance [GO/NO-GO]
```

---

## 🎯 CƠ CHẾ SẢN XUẤT THỰC CHIẾN (M6.2 WORKFLOW)

1. **Phân tích:** Mở `generate.command` $\rightarrow$ Kéo thả video $\rightarrow$ Gemini AI phân tích tạo Timeline JSON.
2. **Render:** Tự động đếm lùi 10s và kích hoạt Hybrid Engine qua:
   ```bash
   RENDER_ENGINE=hybrid node renderer-remotion/scripts/render_orchestrator.js <project_id>
   ```
3. **Tự động Hậu kỳ:** Xuất MP4 (CRF=20, BT.709, Dynamic BGM Audio Ducking) $\rightarrow$ Đẩy file về NAS kèm `post.txt` $\rightarrow$ Đồng bộ Google Sheets $\rightarrow$ Dọn sạch rác `incoming/`.
4. **Kiểm toán Manifest:** Tự động tạo `out/manifests/<project_id>_manifest.json`.
5. **Human Review & Sửa lỗi theo phân loại:**
   * 🔴 **P0 (Blocker):** Sửa ngay ở tầng gốc + tạo Regression test case.
   * 🟡 **P1 (Quality):** Ghi nhận, lặp lại $\ge 2-3$ lần mới sửa có hệ thống.
   * 🟢 **P2 (Enhancement):** Bổ sung Primitive mới vào Core Design Kit.
