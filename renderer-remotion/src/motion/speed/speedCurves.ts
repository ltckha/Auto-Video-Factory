/**
 * speedCurves.ts
 * 
 * Thuật toán tính toán Speed Ramping (Lúc nhanh lúc chậm) cho Remotion.
 * Tự động tạo hiệu ứng hãm phanh (Slowmo xuống 0.35x - 0.5x) tại các điểm cao trào (Key Moments)
 * và tua nhanh (2.0x - 3.5x) ở các đoạn di chuyển/chuẩn bị để tối ưu nhịp điệu.
 */

export interface SpeedRampConfig {
  frame: number;
  durationInFrames: number;
  basePlaybackRate: number;
  keyMomentsFrames: number[];
  strategy?: string; // "ramp" | "adaptive" | "uniform"
}

/**
 * Tính toán frame nguồn tương ứng của video gốc dựa trên đường cong tốc độ Speed Ramping
 */
export function computeSpeedRampSourceFrame(config: SpeedRampConfig): number {
  const { frame, durationInFrames, basePlaybackRate, keyMomentsFrames, strategy = "uniform" } = config;

  // Nếu là tốc độ đều (uniform) hoặc không có mốc cao trào, dùng tuyến tính chuẩn
  if (strategy === "uniform" || !keyMomentsFrames || keyMomentsFrames.length === 0 || durationInFrames <= 0) {
    return Math.round(frame * (basePlaybackRate || 1.0));
  }

  // Bán kính vùng hãm chậm (tương đương khoảng 0.5s - 0.8s xung quanh key moment)
  const slowRadius = Math.max(12, Math.round(durationInFrames * 0.16));

  // Tính trọng số tốc độ tức thời cho từng frame trong toàn bộ scene
  const weights: number[] = [];
  for (let f = 0; f < durationInFrames; f++) {
    let minDist = Infinity;
    for (const km of keyMomentsFrames) {
      const dist = Math.abs(f - km);
      if (dist < minDist) minDist = dist;
    }

    if (minDist <= slowRadius) {
      // Đường cong hãm phanh mềm mại: hạ tốc độ xuống 0.35x - 0.5x tại đỉnh cao trào
      const progress = minDist / slowRadius; // 0 tại tâm cao trào, 1 tại rìa
      const slowSpeed = 0.35 + 0.65 * Math.sin((progress * Math.PI) / 2);
      weights.push(slowSpeed);
    } else {
      // Vùng xa cao trào: tua nhanh vút lên (2.0x - 3.5x)
      const distFromSlow = minDist - slowRadius;
      const rampUp = 1.2 + Math.min(2.3, (distFromSlow / (durationInFrames * 0.25)) * 1.8);
      weights.push(rampUp);
    }
  }

  // Chuẩn hóa tổng số frame video nguồn cần quét qua
  const totalWeighted = weights.reduce((acc, val) => acc + val, 0);
  const totalSourceFrames = durationInFrames * (basePlaybackRate || 1.0);
  const scale = totalSourceFrames / (totalWeighted || 1);

  // Tích lũy bước nhảy frame cho đến frame hiện tại
  let accumulatedSourceFrame = 0;
  for (let f = 0; f <= frame; f++) {
    accumulatedSourceFrame += (weights[f] || 1.0) * scale;
  }

  return Math.round(accumulatedSourceFrame);
}

/**
 * Tính toán playbackRate hiệu dụng tại frame hiện tại để Remotion ánh xạ
 * chính xác tuyệt đối frame nguồn theo đường cong Speed Ramping.
 */
export function getSpeedRampPlaybackRate(config: SpeedRampConfig): number {
  const { frame, durationInFrames, basePlaybackRate, keyMomentsFrames, strategy = "uniform" } = config;

  if (strategy === "uniform" || !keyMomentsFrames || keyMomentsFrames.length === 0 || durationInFrames <= 0) {
    return basePlaybackRate || 1.0;
  }

  if (frame <= 0) {
    // Frame 0: dùng tốc độ tức thời frame 1 để khởi tạo trơn tru
    const nextAccum = computeSpeedRampSourceFrame({ ...config, frame: 1 });
    return Math.max(0.1, Math.min(6.0, Number(nextAccum.toFixed(4))));
  }

  const accumulatedSourceFrame = computeSpeedRampSourceFrame(config);
  const effectiveRate = accumulatedSourceFrame / frame;

  // Giới hạn an toàn trong khoảng [0.1, 6.0]
  return Math.max(0.1, Math.min(6.0, Number(effectiveRate.toFixed(4))));
}

