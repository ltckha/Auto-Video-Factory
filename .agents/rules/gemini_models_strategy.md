# Rule: Gemini Models & Quota Optimization Strategy

## 1. Core Principles
When user provides a Gemini Quota table or requests new model integration:
1. **Never use preview models** unless explicitly requested by the user (strictly avoid `-preview` suffixes).
2. **Classify by Task Type & Quota Tier**:
   - **Heavy Analysis Tier (20 RPD / 5 RPM / 250K TPM)**:
     - Used for: Video Understanding, Storyboard Structuring, Clustering (Pass 1 & Pass 2), Multimodal QA.
     - Default Priority: `gemini-3.7-flash` -> `gemini-3.6-flash` -> `gemini-3.5-flash` -> `gemini-3.0-flash` -> `gemini-2.5-flash`.
   - **Lightweight / High-Frequency Tier (500 RPD / 15 RPM / 250K TPM)**:
     - Used for: `NicheDetect`, Style Learning, Vision OCR Card Analysis, Social Media Copywriting / Captions.
     - Default Priority: `gemini-3.5-flash-lite` -> `gemini-3.1-flash-lite` -> `gemini-3.7-flash` -> `gemini-3.6-flash`.

## 2. Project Mapping
- **Auto-Video-Factory**:
  - Config: `renderer/config/geminiModelsConfig.json`
  - Generator: `renderer/scripts/generateTimeline.js` (Heavy for timeline, Lite for niche)
  - Learn Style & OCR: `renderer/scripts/learnStyle.js`, `renderer/scripts/analyzeCardImageVision.js` (Lite)
- **Omni-Video**:
  - `scripts/generate_ugc_prompt.py` & `scripts/video_qa_analyzer.py`
- **Video-Post**:
  - `core/ai_captioner.py`, `config/settings.py`, `.env` (Lite: `gemini-3.5-flash-lite`)

## 3. Instant Update Protocol
When a new model is introduced:
- Always consult the user before editing files.
- Update `renderer/config/geminiModelsConfig.json` in `Auto-Video-Factory`.
- Update corresponding candidate model arrays across `Omni-Video` and `Video-Post`.
