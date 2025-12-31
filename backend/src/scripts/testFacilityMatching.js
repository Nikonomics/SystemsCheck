require("dotenv").config();
const { Facility } = require("../models");

function normalizeText(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\w\s]/g, "")
    .trim();
}

function extractCoreName(name) {
  return String(name || "")
    .toLowerCase()
    // Expand common abbreviations
    .replace(/\bmt\.?\s*/gi, 'mount ')
    .replace(/\bst\.?\s*/gi, 'saint ')
    .replace(/\bcda\b/gi, 'coeur dalene')
    // Remove common suffixes
    .replace(/\s*(health\s*(and|&)\s*rehabilitation|of\s*cascadia|transitional\s*care|care\s*center|retirement\s*living|snf|alf|ilf|-\s*(snf|alf|ilf))\s*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function wordMatchScore(str1, str2) {
  const words1 = new Set(str1.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const words2 = new Set(str2.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  if (words1.size === 0 || words2.size === 0) return 0;
  let matches = 0;
  for (const word of words1) {
    if (words2.has(word)) matches++;
  }
  return matches / Math.min(words1.size, words2.size);
}

function findBestFacilityMatch(excelName, facilityMap) {
  if (!excelName) return { id: null, name: null, score: 0 };
  const normalizedExcel = normalizeText(excelName);
  const coreExcel = extractCoreName(excelName);
  let bestMatch = { id: null, name: null, score: 0 };

  for (const [dbName, id] of facilityMap.entries()) {
    const normalizedDb = normalizeText(dbName);
    const coreDb = extractCoreName(dbName);

    if (normalizedDb === normalizedExcel) {
      return { id, name: dbName, score: 1 };
    }

    if (coreDb === coreExcel && coreExcel.length >= 4) {
      return { id, name: dbName, score: 0.95 };
    }

    if (coreDb.includes(coreExcel) && coreExcel.length >= 4) {
      const score = 0.8 + (coreExcel.length / coreDb.length) * 0.1;
      if (score > bestMatch.score) {
        bestMatch = { id, name: dbName, score };
      }
    } else if (coreExcel.includes(coreDb) && coreDb.length >= 4) {
      const score = 0.7 + (coreDb.length / coreExcel.length) * 0.1;
      if (score > bestMatch.score) {
        bestMatch = { id, name: dbName, score };
      }
    }

    const wordScore = wordMatchScore(coreExcel, coreDb);
    if (wordScore > 0.5 && wordScore > bestMatch.score) {
      bestMatch = { id, name: dbName, score: wordScore };
    }
  }

  return bestMatch.score >= 0.5 ? bestMatch : { id: null, name: null, score: 0 };
}

async function testMatching() {
  const facilities = await Facility.findAll({
    attributes: ["id", "name"],
    where: { isActive: true }
  });

  const facilityMap = new Map(facilities.map(f => [f.name, f.id]));

  const excelNames = [
    "Colville",
    "Colville Health and Rehabilitation of Cascadia",
    "Secora",
    "Highland",
    "Libby Care Center",
    "Mountain Valley",
    "Spokane Valley",
    "Paradise Creek ALF",
    "Clarkston",
    "Coeur d'Alene",
    "Boswell Transitional Care of Cascadia",
    "Curry Village (SNF)",
    "Silverton",
    "Mt. Ascension",
    "Mountain View"
  ];

  console.log("=== Improved Facility Matching Test ===\n");

  let matched = 0;
  let unmatched = 0;

  excelNames.forEach(excelName => {
    const match = findBestFacilityMatch(excelName, facilityMap);
    if (match.id) {
      console.log("✓", excelName);
      console.log("  →", match.name, "(score:", match.score.toFixed(2) + ")");
      matched++;
    } else {
      console.log("✗", excelName, "→ NO MATCH");
      unmatched++;
    }
  });

  console.log("\n=== Summary ===");
  console.log("Matched:", matched);
  console.log("Unmatched:", unmatched);

  process.exit(0);
}

testMatching().catch(err => {
  console.error(err);
  process.exit(1);
});
