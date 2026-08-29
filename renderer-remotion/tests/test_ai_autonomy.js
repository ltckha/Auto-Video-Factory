const fs = require("fs");
const path = require("path");

const { resolveCreativeSpecification } = require("../src/styles/creativeResolver");

async function runAiAutonomyTest() {
  console.log(`\n======================================================`);
  console.log(`🧠 PHASE M5: AI AUTONOMOUS INTENT PIPELINE TEST`);
  console.log(`🎯 Testing: Gemini Semantic Intent -> creativeResolver -> Design Spec`);
  console.log(`======================================================\n`);

  const scenarios = [
    {
      id: "SCENARIO_1_LEATHER_ASMR",
      description: "Gemini phát hiện cảnh nhuộm giày da YEN Leather, cảm giác thư thái, đăng TikTok",
      aiPayload: {
        content: {
          title: "Nhuộm Lại Đôi Boots Cũ Bằng Thuốc Nhuộm Da Ý",
          hashtags: ["yen_leather", "phuchoigiay", "asmr", "craft"],
          pipeline_mode: "highlight_cutter",
        },
        intent: {
          emotion: "satisfying",
          energy: 0.45,
        },
        brand: "yen_leather",
        platform: "tiktok",
      },
      expected: {
        styleId: "asmr_craft",
        maxIntensity: 0.55,
        camera: "macro_push",
        cardType: "glass",
      },
    },
    {
      id: "SCENARIO_2_DALAT_TRAVEL",
      description: "Gemini phát hiện video lượn dốc đêm Đà Lạt bằng xe máy điện, đăng Facebook",
      aiPayload: {
        content: {
          title: "Lượn Phố Đêm Đà Lạt Bằng Xe Điện Siêu Chill",
          hashtags: ["dalat", "nightride", "travelvietnam"],
          pipeline_mode: "Long2Short",
        },
        intent: {
          emotion: "calm",
          energy: 0.6,
        },
        brand: "dalat_travel",
        platform: "facebook",
      },
      expected: {
        styleId: "cinematic_travel",
        maxIntensity: 0.5,
        camera: "drift_cam",
        cardType: "glass",
      },
    },
    {
      id: "SCENARIO_3_VIRAL_HOOK",
      description: "Gemini phát hiện cảnh biến hình ngoạn mục, năng lượng bùng nổ, đăng TikTok",
      aiPayload: {
        content: {
          title: "Biến Hình Giày Cũ Nát Thành Siêu Phẩm",
          hashtags: ["viral", "transformation", "tiktok"],
          pipeline_mode: "highlight_cutter",
        },
        intent: {
          style: "viral_tiktok",
          emotion: "shock",
          energy: 0.9,
        },
        brand: "generic_viral",
        platform: "tiktok",
      },
      expected: {
        styleId: "viral_tiktok",
        maxIntensity: 1.0,
        camera: "punch_zoom",
        cardType: "sticker",
      },
    },
    {
      id: "SCENARIO_4_LUXURY_BOOTS",
      description: "Gemini phát hiện video giới thiệu boots da thuộc thủ công cao cấp",
      aiPayload: {
        content: {
          title: "Chiêm Ngưỡng Đôi Boots Da Bò Ý Thủ Công",
          hashtags: ["luxury", "boots", "vogue", "fashion"],
          pipeline_mode: "highlight_cutter",
        },
        intent: {
          style: "luxury_editorial",
          emotion: "premium",
          energy: 0.4,
        },
        brand: "yen_leather",
        platform: "youtube_shorts",
      },
      expected: {
        styleId: "luxury_editorial",
        maxIntensity: 0.45,
        camera: "drift_cam",
        cardType: "editorial",
      },
    },
  ];

  let passedCount = 0;

  for (const sc of scenarios) {
    console.log(`📋 Kiểm tra [${sc.id}]:`);
    console.log(`   💡 Bối cảnh: ${sc.description}`);
    
    const spec = resolveCreativeSpecification(sc.aiPayload);

    const isStyleMatch = spec.token.id === sc.expected.styleId;
    const isIntensityMatch = spec.intensity <= sc.expected.maxIntensity;
    const isCameraMatch = spec.token.camera.defaultMotion === sc.expected.camera;
    const isCardMatch = spec.token.card.type === sc.expected.cardType;

    const allPassed = isStyleMatch && isIntensityMatch && isCameraMatch && isCardMatch;

    if (allPassed) {
      passedCount++;
      console.log(`   ✅ PASS: Tự động phân giải: Style=[${spec.token.id}] | Intensity=[${spec.intensity}] | Camera=[${spec.token.camera.defaultMotion}] | Card=[${spec.token.card.type}]`);
    } else {
      console.log(`   ❌ FAIL: Kết quả không khớp kỳ vọng. Style=[${spec.token.id}] (kỳ vọng ${sc.expected.styleId}) | Intensity=[${spec.intensity}] (kỳ vọng <= ${sc.expected.maxIntensity})`);
    }
    console.log("");
  }

  console.log(`======================================================`);
  console.log(`📊 KẾT QUẢ AI AUTONOMY TEST: ${passedCount}/${scenarios.length} PASSED (${((passedCount/scenarios.length)*100).toFixed(0)}%)`);
  console.log(`======================================================\n`);

  if (passedCount === scenarios.length) {
    console.log(`🎉 100% LUỒNG TỰ ĐỘNG HÓA AI PHÂN GIẢI SÁNG TẠO HOẠT ĐỘNG HOÀN HẢO KHÔNG CẦN CAN THIỆP TAY!\n`);
  }
}

runAiAutonomyTest().catch((err) => {
  console.error("❌ Lỗi AI Autonomy Test:", err.message);
  process.exit(1);
});
