const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const counts = {
  "SNF Clinical Systems Review": { count: 0, files: [] },
  "KEV Hybrid": { count: 0, files: [] },
  "KEV Mini": { count: 0, files: [] },
  "ALF Olympus": { count: 0, files: [] },
  "Unknown": { count: 0, files: [] }
};

function classifyFile(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheets = workbook.SheetNames;

    if (sheets.includes("KEV Score Cards Cover Sheet")) {
      return "KEV Mini";
    } else if (sheets.includes("Cover Sheet") && sheets.includes("Abuse & Grievances")) {
      return "KEV Hybrid";
    } else if (sheets.includes("Clinical Systems Overview") || sheets.some(s => s.includes("1. Change of Condition"))) {
      return "SNF Clinical Systems Review";
    } else if (sheets.some(s => s.toLowerCase().includes("olympus"))) {
      return "ALF Olympus";
    }
    return "Unknown";
  } catch (e) {
    return "Unknown";
  }
}

function scanDir(dir) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (/\.(xlsx|xlsm)$/i.test(item.name) && !item.name.startsWith("~")) {
        const format = classifyFile(fullPath);
        counts[format].count++;
        counts[format].files.push(fullPath);
      }
    }
  } catch (e) {}
}

scanDir("/Users/nikolashulewsky/Desktop/Score Cards");

console.log("=== FILE FORMAT COUNTS ===\n");

let total = 0;
for (const [format, data] of Object.entries(counts)) {
  total += data.count;
}

for (const [format, data] of Object.entries(counts)) {
  if (data.count > 0) {
    const pct = ((data.count / total) * 100).toFixed(1);
    console.log(`${format}: ${data.count} files (${pct}%)`);
  }
}
console.log("");
console.log("Total: " + total + " files");

// Export for question extraction
module.exports = { counts, classifyFile };
