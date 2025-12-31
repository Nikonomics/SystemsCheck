const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const baseDir = "/Users/nikolashulewsky/Desktop/Score Cards";

const getAllFiles = (dir) => {
  const results = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...getAllFiles(fullPath));
    } else if (item.name.match(/\.xlsx$/i) || item.name.match(/\.xlsm$/i)) {
      results.push(fullPath);
    }
  }
  return results;
};

const files = getAllFiles(baseDir);
const formats = {};

files.forEach(file => {
  try {
    const workbook = XLSX.readFile(file);
    const sheets = workbook.SheetNames.join("|");

    let format;
    if (sheets.includes("Clinical Systems Overview") && sheets.includes("1. Change of Condition")) {
      format = "SNF Clinical Systems Review (7 systems)";
    } else if (sheets.includes("KEV Score Cards Cover Sheet")) {
      format = "KEV Score Cards (Mini)";
    } else if (sheets.includes("Cover Sheet") && sheets.includes("Abuse & Grievances")) {
      format = "Hybrid KEV Scorecard";
    } else if (sheets.includes("Score Card Cover") && sheets.includes("Grievances")) {
      format = "ALF Scorecard (Olympus)";
    } else {
      format = "Unknown: " + sheets.substring(0, 80);
    }

    if (formats[format] === undefined) formats[format] = [];
    formats[format].push({
      file: file.replace(baseDir + "/", ""),
      sheets: workbook.SheetNames
    });
  } catch (e) {
    if (formats["ERROR"] === undefined) formats["ERROR"] = [];
    formats["ERROR"].push({ file: file.replace(baseDir + "/", ""), error: e.message });
  }
});

console.log("=== SCORECARD FORMAT SUMMARY ===\n");
Object.entries(formats).forEach(([format, filesList]) => {
  console.log(format + ": " + filesList.length + " files");
  filesList.slice(0, 3).forEach(f => console.log("  - " + f.file));
  if (filesList.length > 3) console.log("  ... and " + (filesList.length - 3) + " more");
  console.log("");
});
