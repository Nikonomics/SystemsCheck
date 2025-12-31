const XLSX = require("xlsx");
const fs = require("fs");

// Normalize question text for comparison
function normalizeQuestion(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/^\d+\)\s*/, "") // Remove item numbers
    .replace(/\(sample\s*\d+\)/gi, "") // Remove (Sample 3)
    .replace(/were applicable areas reviewed[^?]*/gi, "") // Remove common KEV suffix
    .replace(/[^a-z0-9\s]/g, " ") // Remove punctuation
    .replace(/\s+/g, " ")
    .trim()
    .substring(0, 100); // First 100 chars for comparison
}

// Extract keywords from question
function extractKeywords(text) {
  const normalized = normalizeQuestion(text);
  const stopWords = new Set(["the", "a", "an", "is", "are", "was", "were", "to", "of", "and", "or", "in", "for", "on", "with", "by", "as", "at", "if", "be", "has", "have", "had", "do", "does", "did", "that", "this", "each", "all", "per", "any"]);
  return normalized.split(" ").filter(w => w.length > 2 && !stopWords.has(w));
}

// Calculate similarity between two questions
function questionSimilarity(q1, q2) {
  const kw1 = new Set(extractKeywords(q1));
  const kw2 = new Set(extractKeywords(q2));
  if (kw1.size === 0 || kw2.size === 0) return 0;

  let matches = 0;
  for (const word of kw1) {
    if (kw2.has(word)) matches++;
  }
  return matches / Math.max(kw1.size, kw2.size);
}

// Parse SNF Clinical Systems Review
function parseSNF(filePath) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const questions = [];

  const systemSheets = workbook.SheetNames.filter(name => /^\d+\./.test(name));

  for (const sheetName of systemSheets) {
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let categoryCol = -1;
    let maxPointsCol = -1;

    for (let row = 0; row < Math.min(10, data.length); row++) {
      const rowData = data[row];
      if (!rowData) continue;
      for (let col = 0; col < rowData.length; col++) {
        const cell = String(rowData[col] || "").toLowerCase();
        if (cell.includes("category")) categoryCol = col;
        if (cell.includes("max") && cell.includes("point")) maxPointsCol = col;
      }
      if (categoryCol >= 0) break;
    }

    if (categoryCol < 0) continue;

    for (let row = 0; row < data.length; row++) {
      const rowData = data[row];
      if (!rowData) continue;

      const text = String(rowData[categoryCol] || "").trim();
      const maxPoints = parseFloat(rowData[maxPointsCol]);

      if (text && !isNaN(maxPoints) && maxPoints > 0 && maxPoints < 50 && !text.toLowerCase().includes("total")) {
        questions.push({
          format: "SNF",
          system: sheetName,
          text: text,
          maxPoints: maxPoints,
          normalized: normalizeQuestion(text),
          keywords: extractKeywords(text)
        });
      }
    }
  }

  return questions;
}

// Parse KEV Hybrid
function parseKEVHybrid(filePath) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const questions = [];

  const categorySheets = ["Abuse & Grievances", "Accidents & Incidents", "Infection Prevention & Control", "Skin Integrity & Wounds"];

  for (const sheetName of categorySheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let maxScoreCol = 4;
    for (let row = 0; row < Math.min(15, data.length); row++) {
      const rowData = data[row];
      if (!rowData) continue;
      for (let col = 0; col < rowData.length; col++) {
        const cell = String(rowData[col] || "").toLowerCase();
        if (cell.includes("max score")) {
          maxScoreCol = col;
          break;
        }
      }
    }

    for (let row = 0; row < data.length; row++) {
      const rowData = data[row];
      if (!rowData) continue;

      const firstCell = String(rowData[0] || "").trim();
      const itemMatch = firstCell.match(/^(\d+)\)/);

      if (itemMatch) {
        const maxPoints = parseFloat(rowData[maxScoreCol]);
        if (!isNaN(maxPoints) && maxPoints > 0) {
          const text = firstCell.replace(/^\d+\)\s*/, "").trim();
          questions.push({
            format: "KEV Hybrid",
            system: sheetName,
            text: text,
            maxPoints: maxPoints,
            normalized: normalizeQuestion(text),
            keywords: extractKeywords(text)
          });
        }
      }
    }
  }

  return questions;
}

// Parse KEV Mini
function parseKEVMini(filePath) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const questions = [];

  const categorySheets = [
    { sheet: "Abuse & Griev", name: "Abuse & Grievances" },
    { sheet: "Accidents & Incidents", name: "Accidents & Incidents" },
    { sheet: "Inf Prev & Cont", name: "Infection Prevention & Control" },
    { sheet: "Skin Integrity & Wounds", name: "Skin Integrity & Wounds" }
  ];

  for (const { sheet: sheetName, name } of categorySheets) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;

    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    let maxScoreCol = 4;
    for (let row = 0; row < Math.min(15, data.length); row++) {
      const rowData = data[row];
      if (!rowData) continue;
      for (let col = 0; col < rowData.length; col++) {
        const cell = String(rowData[col] || "").toLowerCase();
        if (cell.includes("max score")) {
          maxScoreCol = col;
          break;
        }
      }
    }

    for (let row = 0; row < data.length; row++) {
      const rowData = data[row];
      if (!rowData) continue;

      const firstCell = String(rowData[0] || "").trim();
      const itemMatch = firstCell.match(/^(\d+)\)/);

      if (itemMatch) {
        const maxPoints = parseFloat(rowData[maxScoreCol]);
        if (!isNaN(maxPoints) && maxPoints > 0) {
          const text = firstCell.replace(/^\d+\)\s*/, "").trim();
          questions.push({
            format: "KEV Mini",
            system: name,
            text: text,
            maxPoints: maxPoints,
            normalized: normalizeQuestion(text),
            keywords: extractKeywords(text)
          });
        }
      }
    }
  }

  return questions;
}

// Main execution
const snfFile = "/Users/nikolashulewsky/Desktop/2025 Clinical Systems Review Template 9-21-25.xlsx";
const kevHybridFile = "/Users/nikolashulewsky/Desktop/Score Cards/Columbia Vincero/Alderwood Scorecards/KEV Scorecards 2025/Alderwood July 2025 Hybrid KEV Scorecard 4-4-25 Final.xlsx";
const kevMiniFile = "/Users/nikolashulewsky/Desktop/Score Cards/Northern/KEV Scorecard Colville/Colville January 2025 KEV Score Cards (Mini).xlsm";

const snfQuestions = parseSNF(snfFile);
const kevHybridQuestions = parseKEVHybrid(kevHybridFile);
const kevMiniQuestions = parseKEVMini(kevMiniFile);

console.log("=== QUESTION COUNTS ===\n");
console.log(`SNF Clinical Systems Review: ${snfQuestions.length} questions`);
console.log(`KEV Hybrid: ${kevHybridQuestions.length} questions`);
console.log(`KEV Mini: ${kevMiniQuestions.length} questions`);

// Find matches across formats
console.log("\n=== QUESTION MATCHING ANALYSIS ===\n");

const SIMILARITY_THRESHOLD = 0.5;

// Group all questions by topic area
const topicGroups = {};

function addToTopicGroup(question, matchingQuestions) {
  const key = question.keywords.slice(0, 3).sort().join("-") || "misc";
  if (!topicGroups[key]) {
    topicGroups[key] = [];
  }
  topicGroups[key].push({
    ...question,
    matches: matchingQuestions
  });
}

// Find matches for each SNF question
console.log("=== SNF QUESTIONS WITH KEV MATCHES ===\n");

let snfWithMatches = 0;
let snfNoMatches = 0;

for (const snfQ of snfQuestions) {
  const hybridMatches = kevHybridQuestions
    .map(q => ({ ...q, similarity: questionSimilarity(snfQ.text, q.text) }))
    .filter(q => q.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);

  const miniMatches = kevMiniQuestions
    .map(q => ({ ...q, similarity: questionSimilarity(snfQ.text, q.text) }))
    .filter(q => q.similarity >= SIMILARITY_THRESHOLD)
    .sort((a, b) => b.similarity - a.similarity);

  if (hybridMatches.length > 0 || miniMatches.length > 0) {
    snfWithMatches++;
    console.log(`[SNF] ${snfQ.system}`);
    console.log(`  Q: ${snfQ.text.substring(0, 80)}...`);

    if (hybridMatches.length > 0) {
      console.log(`  → KEV Hybrid (${(hybridMatches[0].similarity * 100).toFixed(0)}%): ${hybridMatches[0].text.substring(0, 60)}...`);
    }
    if (miniMatches.length > 0) {
      console.log(`  → KEV Mini (${(miniMatches[0].similarity * 100).toFixed(0)}%): ${miniMatches[0].text.substring(0, 60)}...`);
    }
    console.log("");
  } else {
    snfNoMatches++;
  }
}

console.log("\n=== SUMMARY ===\n");
console.log(`SNF questions with KEV matches: ${snfWithMatches} / ${snfQuestions.length} (${(snfWithMatches/snfQuestions.length*100).toFixed(1)}%)`);
console.log(`SNF questions with NO KEV match: ${snfNoMatches} / ${snfQuestions.length} (${(snfNoMatches/snfQuestions.length*100).toFixed(1)}%)`);

// List SNF questions with no matches
console.log("\n=== SNF QUESTIONS WITH NO KEV EQUIVALENT ===\n");

for (const snfQ of snfQuestions) {
  const hybridMatches = kevHybridQuestions.filter(q => questionSimilarity(snfQ.text, q.text) >= SIMILARITY_THRESHOLD);
  const miniMatches = kevMiniQuestions.filter(q => questionSimilarity(snfQ.text, q.text) >= SIMILARITY_THRESHOLD);

  if (hybridMatches.length === 0 && miniMatches.length === 0) {
    console.log(`[${snfQ.system}] ${snfQ.text.substring(0, 100)}...`);
  }
}

// KEV Hybrid questions unique (not in SNF)
console.log("\n=== KEV HYBRID QUESTIONS NOT IN SNF ===\n");

let hybridUnique = 0;
for (const kevQ of kevHybridQuestions) {
  const snfMatches = snfQuestions.filter(q => questionSimilarity(kevQ.text, q.text) >= SIMILARITY_THRESHOLD);
  if (snfMatches.length === 0) {
    hybridUnique++;
    console.log(`[${kevQ.system}] ${kevQ.text.substring(0, 100)}...`);
  }
}
console.log(`\nTotal KEV Hybrid unique: ${hybridUnique} / ${kevHybridQuestions.length}`);

// KEV Mini questions unique (not in SNF or Hybrid)
console.log("\n=== KEV MINI QUESTIONS NOT IN SNF OR HYBRID ===\n");

let miniUnique = 0;
for (const kevQ of kevMiniQuestions) {
  const snfMatches = snfQuestions.filter(q => questionSimilarity(kevQ.text, q.text) >= SIMILARITY_THRESHOLD);
  const hybridMatches = kevHybridQuestions.filter(q => questionSimilarity(kevQ.text, q.text) >= SIMILARITY_THRESHOLD);
  if (snfMatches.length === 0 && hybridMatches.length === 0) {
    miniUnique++;
    console.log(`[${kevQ.system}] ${kevQ.text.substring(0, 100)}...`);
  }
}
console.log(`\nTotal KEV Mini unique: ${miniUnique} / ${kevMiniQuestions.length}`);
