import { FoleyType, SonicMaterialConfig } from "../types";

export interface SoundProfile {
  id: FoleyType;
  name: string;
  description: string;
  defaultConfig: SonicMaterialConfig;
  sfxCue: string;
}

export const SOUND_PROFILES: Record<FoleyType, SoundProfile> = {
  leather_rub: {
    id: "leather_rub",
    name: "Leather Friction / Rub",
    description: "Âm thanh miết da êm dịu, tăng cảm giác xúc giác da mộc tự nhiên",
    sfxCue: "sfx_leather_rub_soft",
    defaultConfig: {
      foleyType: "leather_rub",
      gain: 0.85,
      pitchVariation: 0.05,
      timingOffsetFrames: 2,
    },
  },
  stitch_pull: {
    id: "stitch_pull",
    name: "Stitch Thread Pull",
    description: "Tiếng kéo sợi chỉ qua lỗ đục da sắc gọn",
    sfxCue: "sfx_thread_pull",
    defaultConfig: {
      foleyType: "stitch_pull",
      gain: 0.75,
      pitchVariation: 0.08,
      timingOffsetFrames: 0,
    },
  },
  stamp_press: {
    id: "stamp_press",
    name: "Tactile Stamp Impact",
    description: "Tiếng đóng dấu dập búa đầm chắc có độ nảy nhẹ",
    sfxCue: "sfx_stamp_impact",
    defaultConfig: {
      foleyType: "stamp_press",
      gain: 0.9,
      pitchVariation: 0.03,
      timingOffsetFrames: 8,
    },
  },
  paper_tear: {
    id: "paper_tear",
    name: "Kraft Paper Rustle / Tear",
    description: "Tiếng sột soạt của giấy Kraft mộc mạc và tiếng xé nhẹ",
    sfxCue: "sfx_paper_tear",
    defaultConfig: {
      foleyType: "paper_tear",
      gain: 0.7,
      pitchVariation: 0.06,
      timingOffsetFrames: 3,
    },
  },
  hammer_tap: {
    id: "hammer_tap",
    name: "Craft Hammer Tap",
    description: "Tiếng búa gõ đục lỗ da dứt khoát",
    sfxCue: "sfx_hammer_tap",
    defaultConfig: {
      foleyType: "hammer_tap",
      gain: 0.85,
      pitchVariation: 0.04,
      timingOffsetFrames: 4,
    },
  },
  brush_sweep: {
    id: "brush_sweep",
    name: "Soft Brush Sweep",
    description: "Tiếng cọ quét keo hoặc chải xi mềm mại",
    sfxCue: "sfx_brush_sweep",
    defaultConfig: {
      foleyType: "brush_sweep",
      gain: 0.75,
      pitchVariation: 0.05,
      timingOffsetFrames: 2,
    },
  },
  clip_click: {
    id: "clip_click",
    name: "Paper Clip Click",
    description: "Tiếng bấm kẹp kim loại đanh gọn",
    sfxCue: "sfx_clip_click",
    defaultConfig: {
      foleyType: "clip_click",
      gain: 0.8,
      pitchVariation: 0.02,
      timingOffsetFrames: 5,
    },
  },
  whoosh_soft: {
    id: "whoosh_soft",
    name: "Soft Wind Whoosh",
    description: "Tiếng gió vút nhẹ nhàng khi chuyển cảnh",
    sfxCue: "sfx_whoosh_soft",
    defaultConfig: {
      foleyType: "whoosh_soft",
      gain: 0.65,
      pitchVariation: 0.03,
      timingOffsetFrames: 0,
    },
  },
  none: {
    id: "none",
    name: "No Foley",
    description: "Không kèm âm thanh foley",
    sfxCue: "",
    defaultConfig: {
      foleyType: "none",
      gain: 0,
      pitchVariation: 0,
      timingOffsetFrames: 0,
    },
  },
};
