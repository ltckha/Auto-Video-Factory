#!/usr/bin/env node

const { getNextEmptyJobFromSheet } = require("./googleSheetsSync");

(async () => {
  try {
    const job = await getNextEmptyJobFromSheet();
    if (job) {
      console.log(JSON.stringify(job));
      process.exit(0);
    } else {
      process.exit(2); // 2: No empty jobs found
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
