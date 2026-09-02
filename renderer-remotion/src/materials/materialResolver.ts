import { MATERIAL_FAMILIES } from "./materialRegistry";
import { MaterialFamily, MaterialFamilyId, VisualMaterialConfig } from "./types";

export interface MaterialResolutionResult {
  family: MaterialFamily;
  visual: VisualMaterialConfig;
  sfxCue: string;
  enableStitching: boolean;
  enableHandMark: boolean;
  enableTape: boolean;
  enableStamp: boolean;
  enableDimension: boolean;
  enableLightSweep: boolean;
  enableStepBadge: boolean;
  enableStarRating: boolean;
  stepNumber: string;
}

/**
 * Resolves AI Creative Intent & Video Context into a complete Sensory Material Configuration
 */
export function resolveMaterialSpecification(
  scene: {
    subtitle?: string;
    subtitle_style?: string;
    visual_intent?: string;
    visual_cue?: string;
    advanced_effect?: { name?: string; intent?: string };
    scene_type?: string;
  },
  nicheHint: string = "leather"
): MaterialResolutionResult {
  const text = `${scene.subtitle || ""} ${scene.visual_cue || ""} ${scene.visual_intent || ""} ${nicheHint}`.toLowerCase();

  // 1. Determine Material Family
  let familyId: MaterialFamilyId = "artisan_leather";

  if (text.includes("farm") || text.includes("vườn") || text.includes("nông") || text.includes("dalat") || text.includes("củ") || text.includes("trái")) {
    familyId = "organic_farm";
  } else if (text.includes("giá") || text.includes("kích thước") || text.includes("size") || text.includes("mm") || text.includes("bảo hành") || text.includes("độ dày")) {
    familyId = "product_showcase";
  } else if (text.includes("fashion") || text.includes("lookbook") || text.includes("thời trang") || text.includes("outfit")) {
    familyId = "editorial_look";
  } else {
    familyId = "artisan_leather";
  }

  const family = MATERIAL_FAMILIES[familyId];

  // 2. Determine Procedural Features
  const isHook = scene.scene_type === "hook";
  const isLeather = familyId === "artisan_leather";
  const isFarm = familyId === "organic_farm";
  const isProduct = familyId === "product_showcase";

  const enableStitching = isLeather && (text.includes("may") || text.includes("chỉ") || text.includes("khâu") || isHook);
  const enableHandMark = text.includes("chi tiết") || text.includes("điểm") || text.includes("mẹo") || isHook;
  const enableTape = isFarm || (isLeather && text.includes("rập"));
  const enableStamp = isLeather && (text.includes("thương hiệu") || text.includes("chuẩn") || text.includes("dập") || isHook);
  const enableDimension = isProduct || text.includes("mm") || text.includes("dày") || text.includes("kích thước");
  const enableLightSweep = isLeather || isProduct || text.includes("bóng") || text.includes("mới");

  // Step sequence & Star Rating resolution
  const enableStepBadge = text.includes("bước") || text.includes("step") || text.includes("giai đoạn") || text.includes("quy trình");
  const stepMatch = text.match(/bước\s*(\d+)/i) || text.match(/step\s*(\d+)/i);
  const stepNumber = stepMatch ? stepMatch[1] : "01";

  const enableStarRating = text.includes("5 sao") || text.includes("đánh giá") || text.includes("chất lượng") || text.includes("uy tín");

  const visualConfig: VisualMaterialConfig = {
    surface: family.defaultSurface,
    mark: enableDimension ? "dimension" : enableHandMark ? family.defaultMark : "none",
    physicalElement: enableTape ? "tape" : enableStamp ? "stamp" : family.defaultPhysical,
    light: enableLightSweep ? "specular_sweep" : family.defaultLight,
    primaryColor: isLeather ? "#FFE600" : isFarm ? "#A4C639" : "#FFFFFF",
    opacity: 0.9,
  };

  return {
    family,
    visual: visualConfig,
    sfxCue: family.defaultFoley,
    enableStitching,
    enableHandMark,
    enableTape,
    enableStamp,
    enableDimension,
    enableLightSweep,
    enableStepBadge,
    enableStarRating,
    stepNumber,
  };
}
