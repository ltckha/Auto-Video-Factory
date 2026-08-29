function adaptTimelineToRemotion(timelineData, fps = 30) {
  let totalDurationFrames = 0;
  const timeline = timelineData.timeline || [];
  const meta = timelineData.video_meta || {};

  const scenes = timeline.map((sc, idx) => {
    const targetDurSec = Number(sc.duration_s !== undefined ? sc.duration_s : sc.duration) || 3.0;
    const startSec = Number(sc.start_s !== undefined ? sc.start_s : sc.start) || 0;
    const endSec = Number(sc.end_s !== undefined ? sc.end_s : sc.end) || (startSec + targetDurSec);

    const sourceDurSec = Math.max(0.1, endSec - startSec);
    const playbackRate = Number((sourceDurSec / Math.max(0.1, targetDurSec)).toFixed(4));

    const durationInFrames = Math.max(1, Math.round(targetDurSec * fps));
    const startFromFrame = Math.max(0, Math.round(startSec * fps));
    totalDurationFrames += durationInFrames;

    return {
      id: sc.scene_id || `scene_${idx}`,
      type: sc.scene_type || "body",
      startFromFrame,
      durationInFrames,
      playbackRate,
      subtitle: (sc.subtitle || "").trim(),
      position: sc.text_position || "top",
      cameraMotion: sc.scene_type === "hook" || idx === 0 ? "punch_zoom" : "macro_push",
    };
  });

  return {
    totalDurationFrames,
    scenes,
  };
}

module.exports = {
  adaptTimelineToRemotion,
};
