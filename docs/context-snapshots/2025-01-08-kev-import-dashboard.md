# Context Snapshot: KEV Import & Dashboard Improvements
**Date**: 2025-01-08
**Status**: Session Complete

---

## What We're Building

SystemsCheck - a quality audit tracking system for skilled nursing facilities. This session focused on:
1. KEV Historical Import feature for bulk uploading legacy scorecard data
2. Dashboard improvements to show completion % that includes KEV records
3. Team/Company comparison charts with metric toggles

---

## Decisions Locked In

| Decision | Rationale | Status |
|----------|-----------|--------|
| KEV imports use percentage scores only | Raw met/possible breakdowns are inconsistent across formats; percentages are reliable | RESOLVED |
| `met > possible` is a warning, not error | Doesn't block import since we only store percentages | RESOLVED |
| Intra-batch duplicates allow user selection | Radio-button behavior lets user choose which file to import | RESOLVED |
| Completion % = Scorecards + KevHistorical | Both audit types count toward facility's monthly completion | RESOLVED |
| Team comparison X-axis shows months | Line chart with teams as series, months as X-axis | RESOLVED |
| Admin/corporate can view all teams | No company filter required for elevated roles | RESOLVED |

---

## Constraints & Assumptions

- **4 quality areas tracked**: Abuse & Grievances, Accidents & Incidents, Infection Prevention & Control, Skin Integrity & Wounds
- **KEV format detection by sheet names**:
  - KEV Mini: "KEV Score Cards Cover Sheet"
  - KEV Hybrid: "Cover Sheet" + "Abuse & Grievances"
- **Cover sheet data only**: Individual audit line items are NOT imported from KEV files
- **No overwrite on duplicate**: Database duplicates block import; must rollback batch first
- **Unique constraint**: One record per facility/month/year in kev_historical table

---

## Open Items

| Item | Status | Notes |
|------|--------|-------|
| ALF Scorecard parser | OPEN | Format identified (.xlsx), needs analysis and implementation |
| Clinical Systems Review parser | OPEN | Format identified (.xlsx), needs analysis and implementation |

---

## Items Resolved This Session

| Issue | Resolution |
|-------|------------|
| "Company ID required" on Team Reports | Admin/corporate users bypass company filter; added `showAllTeams` flag |
| Duplicate files couldn't be selected | Changed from error to warning with `duplicateGroup` field; radio-button UI |
| "met > possible" blocking uploads | Changed from error to warning in `kevCoverSheetParser.js` |
| Facility override not enabling selection | Added `canBeFixed` logic to enable checkbox when override applied |
| Team comparison showing teams on X-axis | Refactored to LineChart with months on X-axis, teams as series |
| Missing metric toggle on dashboards | Added score/completion toggle to TeamComparison and CompanyComparison |

---

## Reusable Logic

### Completion Calculation Pattern
```javascript
// backend/src/routes/reports.js - getCompletedAudits()
async function getCompletedAudits(facilityIds, dateFilter) {
  const completedSet = new Set();

  // Get completed scorecards
  const scorecards = await Scorecard.findAll({ where: { facilityId: facilityIds, ...dateFilter } });
  scorecards.forEach(sc => completedSet.add(`${sc.facilityId}-${sc.month}-${sc.year}`));

  // Get KEV historical records
  const kevRecords = await KevHistorical.findAll({ where: { facilityId: facilityIds, ...dateFilter } });
  kevRecords.forEach(kev => completedSet.add(`${kev.facilityId}-${kev.month}-${kev.year}`));

  return completedSet;
}
```

### Override-Aware Selection Logic
```javascript
// frontend/src/pages/admin/KevHistoricalImport.jsx
const hasFacilityOverride = !!facilityOverrides[r.filename];
const hasDateOverride = !!(dateOverrides[r.filename]?.month && dateOverrides[r.filename]?.year);
const canBeFixed = (r.needsFacility && hasFacilityOverride) ||
                   (r.needsDateOverride && hasDateOverride);
const canSelect = r.isValid || r.isDuplicateInBatch || canBeFixed;
```

### Duplicate Group Radio Behavior
```javascript
// When selecting a file in a duplicate group, deselect others
if (result?.duplicateGroup) {
  validationResults.results
    .filter(r => r.duplicateGroup === result.duplicateGroup && r.filename !== filename)
    .forEach(r => { newSelected[r.filename] = false; });
}
```

---

## Key Files Modified

| File | Changes |
|------|---------|
| `backend/src/routes/reports.js` | Added KevHistorical to completion calc, fixed admin/corporate access |
| `backend/src/routes/import.js` | Duplicate handling, duplicateGroup field |
| `backend/src/utils/kevCoverSheetParser.js` | met > possible as warning |
| `frontend/src/pages/admin/KevHistoricalImport.jsx` | Override selection, duplicate UI |
| `frontend/src/pages/reports/TeamComparison.jsx` | Months on X-axis, metric toggle |
| `frontend/src/pages/reports/CompanyComparison.jsx` | Metric toggle |

---

## Next Suggested Step

If continuing KEV import work:
1. **Test bulk upload** with mixed KEV Mini and Hybrid files
2. **Analyze ALF Scorecard format** - identify sheet structure and data locations
3. **Implement ALF parser** following pattern in `kevCoverSheetParser.js`

---

## Related Documentation

- `docs/kev-import-methodology.md` - Detailed validation rules and data model
