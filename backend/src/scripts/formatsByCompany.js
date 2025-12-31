const XLSX = require("xlsx");
const fs = require("fs");
const path = require("path");

const companies = {
  "Columbia Vincero": { "SNF Clinical Systems Review": 0, "KEV Hybrid": 0, "KEV Mini": 0, "ALF/Unknown": 0 },
  "Envision": { "SNF Clinical Systems Review": 0, "KEV Hybrid": 0, "KEV Mini": 0, "ALF/Unknown": 0 },
  "Northern": { "SNF Clinical Systems Review": 0, "KEV Hybrid": 0, "KEV Mini": 0, "ALF/Unknown": 0 },
  "Olympus": { "SNF Clinical Systems Review": 0, "KEV Hybrid": 0, "KEV Mini": 0, "ALF/Unknown": 0 },
  "Three Rivers": { "SNF Clinical Systems Review": 0, "KEV Hybrid": 0, "KEV Mini": 0, "ALF/Unknown": 0 },
  "Unknown Company": { "SNF Clinical Systems Review": 0, "KEV Hybrid": 0, "KEV Mini": 0, "ALF/Unknown": 0 }
};

function getCompany(filePath) {
  const lower = filePath.toLowerCase();
  if (lower.includes("columbia") || lower.includes("vincero")) return "Columbia Vincero";
  if (lower.includes("envision")) return "Envision";
  if (lower.includes("northern")) return "Northern";
  if (lower.includes("olympus")) return "Olympus";
  if (lower.includes("three rivers") || lower.includes("three_rivers") || lower.includes("threerivers")) return "Three Rivers";
  return "Unknown Company";
}

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
    }
    return "ALF/Unknown";
  } catch (e) {
    return "ALF/Unknown";
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
        const company = getCompany(fullPath);
        companies[company][format]++;
      }
    }
  } catch (e) {}
}

scanDir("/Users/nikolashulewsky/Desktop/Score Cards");

console.log("=== AUDIT FORMAT BY COMPANY ===\n");

// Print header
console.log("Company".padEnd(20) + "| SNF    | Hybrid | Mini   | ALF    | Total");
console.log("-".repeat(70));

let totals = { "SNF Clinical Systems Review": 0, "KEV Hybrid": 0, "KEV Mini": 0, "ALF/Unknown": 0 };

for (const [company, formats] of Object.entries(companies)) {
  const total = Object.values(formats).reduce((a, b) => a + b, 0);
  if (total === 0) continue;

  totals["SNF Clinical Systems Review"] += formats["SNF Clinical Systems Review"];
  totals["KEV Hybrid"] += formats["KEV Hybrid"];
  totals["KEV Mini"] += formats["KEV Mini"];
  totals["ALF/Unknown"] += formats["ALF/Unknown"];

  console.log(
    company.padEnd(20) + "| " +
    String(formats["SNF Clinical Systems Review"]).padEnd(6) + " | " +
    String(formats["KEV Hybrid"]).padEnd(6) + " | " +
    String(formats["KEV Mini"]).padEnd(6) + " | " +
    String(formats["ALF/Unknown"]).padEnd(6) + " | " +
    total
  );
}

console.log("-".repeat(70));
const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0);
console.log(
  "TOTAL".padEnd(20) + "| " +
  String(totals["SNF Clinical Systems Review"]).padEnd(6) + " | " +
  String(totals["KEV Hybrid"]).padEnd(6) + " | " +
  String(totals["KEV Mini"]).padEnd(6) + " | " +
  String(totals["ALF/Unknown"]).padEnd(6) + " | " +
  grandTotal
);

console.log("\n=== PRIMARY FORMAT BY COMPANY ===\n");

for (const [company, formats] of Object.entries(companies)) {
  const total = Object.values(formats).reduce((a, b) => a + b, 0);
  if (total === 0) continue;

  const primary = Object.entries(formats).sort((a, b) => b[1] - a[1])[0];
  const pct = ((primary[1] / total) * 100).toFixed(0);

  console.log(`${company}: ${primary[0]} (${pct}% of ${total} files)`);
}

// List facilities per company
console.log("\n=== FACILITIES BY COMPANY ===\n");

const facilitiesByCompany = {};

function scanForFacilities(dir, company = null) {
  try {
    const items = fs.readdirSync(dir, { withFileTypes: true });
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        // Check if this directory is a company folder
        const lower = item.name.toLowerCase();
        let detectedCompany = company;
        if (lower.includes("columbia") || lower.includes("vincero")) detectedCompany = "Columbia Vincero";
        else if (lower.includes("envision")) detectedCompany = "Envision";
        else if (lower.includes("northern")) detectedCompany = "Northern";
        else if (lower.includes("olympus")) detectedCompany = "Olympus";
        else if (lower.includes("three rivers")) detectedCompany = "Three Rivers";

        scanForFacilities(fullPath, detectedCompany);
      } else if (/\.(xlsx|xlsm)$/i.test(item.name) && !item.name.startsWith("~") && company) {
        if (!facilitiesByCompany[company]) facilitiesByCompany[company] = new Set();

        // Extract facility name from filename or parent folder
        const parentFolder = path.basename(path.dirname(fullPath));
        if (parentFolder.toLowerCase().includes("scorecard")) {
          const facilityFolder = path.basename(path.dirname(path.dirname(fullPath)));
          facilitiesByCompany[company].add(facilityFolder);
        } else {
          facilitiesByCompany[company].add(parentFolder);
        }
      }
    }
  } catch (e) {}
}

scanForFacilities("/Users/nikolashulewsky/Desktop/Score Cards");

for (const [company, facilities] of Object.entries(facilitiesByCompany)) {
  console.log(`${company}:`);
  const sortedFacilities = Array.from(facilities).sort();
  for (const facility of sortedFacilities) {
    console.log(`  - ${facility}`);
  }
  console.log("");
}
