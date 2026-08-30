import { DesignToken } from "../styles/tokens";
import { resolveCreativeSpecification } from "../styles/creativeResolver";
import { resolveStyleToken } from "../styles/styleResolver";
import { BrandDnaProfile, PlatformType } from "../brand/brandDna";
import { adaptLegacyKnowledgeToMotion } from "../knowledge/legacyAdapter";

export interface TimelineScene {
  scene_id?: string;
  scene_type?: string;
  start_s?: number;
  end_s?: number;
  duration_s?: number;
  start?: number;
  end?: number;
  duration?: number;
  subtitle?: string;
  subtitle_style?: string;
  text_position?: "top" | "center" | "bottom";
  text_effect?: {
    name: string;
    description?: string;
  };
  transition_out?: {
    type: string;
    duration: number;
  } | null;
  advanced_effect?: any;
  speed_strategy?: string;
  include?: boolean;
}

export interface TimelineData {
  video_meta: {
    title: string;
    description?: string;
    hashtags?: string[];
    audio_strategy?: string;
    has_original_music?: boolean;
    input_file?: string;
    pipeline_mode?: string;
    style?: string;
    brand?: string;
    platform?: PlatformType;
  };
  timeline: TimelineScene[];
  audio_config?: {
    bgm_mood?: string;
    enable_sfx?: boolean;
    has_original_music?: boolean;
  };
}

export interface AdaptedScene {
  id: string;
  type: string;
  startFromFrame: number;
  durationInFrames: number;
  playbackRate: number;
  subtitle: string;
  subtitleStyle: string;
  position: "top" | "center" | "bottom";
  cameraMotion: "punch_zoom" | "macro_push" | "drift_cam" | "snap_zoom" | "overshoot_zoom" | "static";
  token: DesignToken;
  intensity: number;
  brand: BrandDnaProfile;
  platform: PlatformType;
  transitionOut?: {
    type: string;
    duration: number;
  } | null;
  speedStrategy?: string;
}

export function adaptTimelineToRemotion(
  timelineData: TimelineData,
  fps = 30,
  options?: { platform?: PlatformType; brand?: string }
): {
  totalDurationFrames: number;
  scenes: AdaptedScene[];
} {
  let totalDurationFrames = 0;
  const rawTimeline = timelineData.timeline || [];
  const meta = timelineData.video_meta || {};

  // 1. FILTER: Exclude scenes where include is explicitly false
  const activeTimeline = rawTimeline.filter((sc) => sc.include !== false);

  const platform = options?.platform || meta.platform || "tiktok";
  const brand = options?.brand || meta.brand || "yen_leather";

  // 2. Resolve Master Video Spec
  const globalSpec = resolveCreativeSpecification({
    brand,
    platform,
    content: {
      title: meta.title,
      hashtags: meta.hashtags,
      pipeline_mode: meta.pipeline_mode,
    },
    intent: {
      style: meta.style,
    },
  });

  const scenes: AdaptedScene[] = activeTimeline.map((sc, idx) => {
    const startSec = Number(sc.start_s !== undefined ? sc.start_s : sc.start) || 0;
    const targetDurSec = Number(sc.duration_s !== undefined ? sc.duration_s : sc.duration) || 3.0;
    const endSec = Number(sc.end_s !== undefined ? sc.end_s : sc.end) || (startSec + targetDurSec);

    const sourceDurSec = Math.max(0.1, endSec - startSec);
    // Exact Speedup Playback Rate
    const playbackRate = Number((sourceDurSec / Math.max(0.1, targetDurSec)).toFixed(4));

    const durationInFrames = Math.max(1, Math.round(targetDurSec * fps));
    const startFromFrame = Math.max(0, Math.round(startSec * fps));
    totalDurationFrames += durationInFrames;

    // 3. Per-Scene Subtitle Style Resolution
    const sceneSubStyle = String(sc.subtitle_style || "").toLowerCase().trim();
    let sceneToken: DesignToken;

    if (sceneSubStyle.includes("yellow_lightning") || sceneSubStyle.includes("sticker")) {
      sceneToken = resolveStyleToken({ style: "viral_tiktok" });
    } else if (sceneSubStyle.includes("warning") || sceneSubStyle.includes("red") || sceneSubStyle.includes("badge")) {
      sceneToken = resolveStyleToken({ style: "product_commercial" });
    } else if (sceneSubStyle.includes("glass") || sceneSubStyle.includes("minimal")) {
      sceneToken = globalSpec.token.id === "cinematic_travel" ? resolveStyleToken({ style: "cinematic_travel" }) : resolveStyleToken({ style: "asmr_craft" });
    } else {
      sceneToken = globalSpec.token;
    }

    // 4. Per-Scene Camera Motion mapping via Knowledge Registry Adapter
    const effectQuery = String(
      sc.advanced_effect?.name || sc.advanced_effect?.intent || sc.advanced_effect?.camera_motion || ""
    );
    const motionChoice = adaptLegacyKnowledgeToMotion(effectQuery, {
      brand,
      platform,
      isHook: sc.scene_type === "hook" || idx === 0,
      defaultMotion: sceneToken.camera.defaultMotion,
    });

    const sceneIntensity = sc.advanced_effect?.intensity !== undefined
      ? Number(sc.advanced_effect.intensity)
      : motionChoice.intensity || globalSpec.intensity;

    return {
      id: sc.scene_id || `scene_${idx}`,
      type: sc.scene_type || "body",
      startFromFrame,
      durationInFrames,
      playbackRate,
      subtitle: sceneSubStyle === "none" ? "" : (sc.subtitle || "").trim(),
      subtitleStyle: sceneSubStyle,
      position: (sc.text_position as any) || "top",
      cameraMotion: motionChoice.primitiveId,
      token: sceneToken,
      intensity: sceneIntensity,
      brand: globalSpec.brand,
      platform: globalSpec.platform,
      transitionOut: sc.transition_out
        ? {
            type: String(sc.transition_out.type || "fade").toLowerCase(),
            duration: Number(sc.transition_out.duration) || 0.3,
          }
        : null,
      speedStrategy: sc.speed_strategy || "uniform",
    };
  });

  return {
    totalDurationFrames,
    scenes,
  };
}
