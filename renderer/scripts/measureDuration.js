const path = require("path");
const { resolveMultiInputs } = require("./multiInputResolver");

const rawInputs = process.argv.slice(2);
const tempWorkDir = path.resolve(__dirname, "..", "..", "incoming", "temp_concat");

// Redirect console.log to console.error during duration measurement so stdout strictly outputs ONLY the numeric duration
const originalLog = console.log;
console.log = (...args) => console.error(...args);

try {
  const res = resolveMultiInputs(rawInputs, tempWorkDir);
  originalLog(res.totalDuration || 0);
} catch (e) {
  originalLog(0);
}
