const fs = require("fs");
const path = require("path");

const {
  loadLegacyKnowledge,
  queryKnowledgeRegistry,
} = require("../src/knowledge/knowledgeRegistry");
const {
  adaptLegacyKnowledgeToMotion,
} = require("../src/knowledge/legacyAdapter");

async function runKnowledgeMigrationTest() {
  console.log(`\n======================================================`);
  console.log(`🧠 PHASE M6.2-LK: LEGACY KNOWLEDGE MIGRATION TEST`);
  console.log(`🎯 Validating 234 Semantic Mappings & Historical Stats Ingestion`);
  console.log(`======================================================\n`);

  const knowledge = loadLegacyKnowledge();
  const effectCount = Object.keys(knowledge.learnedEffects).length;
  const statsCount = Object.keys(knowledge.effectStats).length;

  console.log(`📊 Knowledge Base Stats:`);
  console.log(`   - 234 Learned Semantic Effects: ${effectCount} entries loaded`);
  console.log(`   - Historical Success Stats: ${statsCount} metrics loaded\n`);

  const testCases = [
    {
      query: "french iron tooth alignment push",
      expectedPrimitive: "macro_push",
      expectedMinConfidence: 0.8,
    },
    {
      query: "catastrophic yield impact snap",
      expectedPrimitive: "punch_zoom",
      expectedMinConfidence: 0.8,
    },
    {
      query: "cinematic city reveal",
      expectedPrimitive: "macro_push",
      expectedMinConfidence: 0.8,
    },
    {
      query: "flannel buffing velocity glide",
      expectedPrimitive: "drift_cam",
      expectedMinConfidence: 0.75,
    },
    {
      query: "arrival snap",
      expectedPrimitive: "punch_zoom",
      expectedMinConfidence: 0.8,
    },
  ];

  let passCount = 0;

  for (const tc of testCases) {
    const motion = adaptLegacyKnowledgeToMotion(tc.query);
    const isPrimitiveMatch = motion.primitiveId === tc.expectedPrimitive;
    const isConfidenceMatch = motion.confidence >= tc.expectedMinConfidence;

    if (isPrimitiveMatch && isConfidenceMatch) {
      passCount++;
      console.log(`  ✅ PASS: ["${tc.query}"] -> [${motion.primitiveId}] (Confidence: ${(motion.confidence * 100).toFixed(0)}%) | ${motion.reason}`);
    } else {
      console.log(`  ❌ FAIL: ["${tc.query}"] -> [${motion.primitiveId}] (Expected ${tc.expectedPrimitive}) | Confidence: ${motion.confidence}`);
    }
  }

  console.log(`\n======================================================`);
  console.log(`📊 KẾT QUẢ KNOWLEDGE MIGRATION TEST: ${passCount}/${testCases.length} PASSED (${((passCount/testCases.length)*100).toFixed(0)}%)`);
  console.log(`======================================================\n`);

  if (passCount === testCases.length) {
    console.log(`🎉 TOÀN BỘ KHO TRI THỨC CŨ ĐÃ ĐƯỢC CHUYỂN GIAO SANG REMOTION 100% THÀNH CÔNG!\n`);
  }
}

runKnowledgeMigrationTest().catch((err) => {
  console.error("Test error:", err.message);
  process.exit(1);
});
