# KEV Import Methodology

This document captures the business rules, validation logic, and data model decisions for the KEV Historical Import feature.

## Scorecard Format Detection

Four distinct scorecard formats have been identified in use:

| Format | Extension | Detection Logic | Parser Status |
|--------|-----------|-----------------|---------------|
| KEV Mini | .xlsm | Has sheet "KEV Score Cards Cover Sheet" | Implemented |
| KEV Hybrid | .xlsx | Has sheets "Cover Sheet" + "Abuse & Grievances" | Implemented |
| ALF Scorecard | .xlsx | TBD | Not implemented |
| Clinical Systems Review | .xlsx | TBD | Not implemented |

### Detection Code Reference
- `backend/src/utils/kevCoverSheetParser.js:detectKevFormat()`

## Quality Areas Tracked

Both KEV formats track these 4 quality areas:
1. Abuse & Grievances
2. Accidents & Incidents
3. Infection Prevention & Control
4. Skin Integrity & Wounds

## Validation Rules

### Errors (Block Import)
- **Missing facility**: Cannot match facility name to database (unless override provided)
- **Missing date**: Cannot extract month/year from file (unless override provided)
- **Database duplicate**: Record already exists for facility/month/year combination
- **No quality area scores**: Cover sheet has no extractable category data

### Warnings (Allow Import)
- **Met > Possible scores**: The raw met/possible breakdown may be inconsistent, but percentages are correct. KEV imports use percentage scores, not raw breakdowns.
- **Intra-batch duplicates**: Multiple files for same facility/month in upload batch. User must choose which one to import.
- **Fuzzy facility match**: Facility name matched with <100% confidence (shows match score)
- **Incomplete quality areas**: Fewer than 4 categories found

### Override Behavior
- **Facility override**: User selects facility from dropdown when auto-match fails
- **Date override**: User manually enters month/year when extraction fails
- Files become selectable immediately after override is applied (shows 🔄 indicator)
- User must click "Apply Overrides" to revalidate before import

## Duplicate Handling

### Intra-Batch Duplicates
When multiple files in the same upload are for the same facility/month/year:
- Both files are marked with `duplicateGroup` field
- First file is auto-selected, second is deselected
- Radio-button behavior: selecting one deselects others in same group
- User chooses which file to import

### Database Duplicates
When a file matches an existing record in `kev_historical` table:
- Marked as error (cannot import)
- Must delete existing record first or skip the file

## Completion Percentage Calculation

Completion % on dashboards includes BOTH regular scorecards AND KEV historical records:

```
Completion % = (Unique Facility-Month-Year combinations) / (Facilities × Expected Months) × 100
```

The `getCompletedAudits()` helper function in `backend/src/routes/reports.js` unions:
- `Scorecard` table records
- `KevHistorical` table records

This ensures facilities using either audit type are counted as having completed their monthly audits.

## Data Model

### KevHistorical Table Fields
| Field | Type | Description |
|-------|------|-------------|
| facilityId | INT | FK to Facility |
| month | INT | 1-12 |
| year | INT | e.g., 2025 |
| overallScore | DECIMAL | Overall percentage (0-100) |
| abuseGrievancesScore | DECIMAL | Category percentage |
| accidentsIncidentsScore | DECIMAL | Category percentage |
| infectionControlScore | DECIMAL | Category percentage |
| skinIntegrityScore | DECIMAL | Category percentage |
| auditCompletedBy | VARCHAR | Name of auditor |
| dateOfCompletion | DATE | When audit was completed |
| importBatchId | UUID | For rollback tracking |
| sourceFilename | VARCHAR | Original filename |

### Import Batch Tracking
- Each import creates an `ImportBatch` record
- All imported `KevHistorical` records link to batch via `importBatchId`
- Rollback deletes all records with matching `importBatchId`

## File Locations

- **Parser**: `backend/src/utils/kevCoverSheetParser.js`
- **Date Extractor**: `backend/src/utils/dateExtractor.js`
- **Import Routes**: `backend/src/routes/import.js`
- **Frontend**: `frontend/src/pages/admin/KevHistoricalImport.jsx`

## Future Considerations

1. **ALF Scorecard Parser**: Need to analyze format and implement parser
2. **Clinical Systems Review Parser**: Need to analyze format and implement parser
3. **Bulk delete/re-import**: Currently must rollback entire batch; may want selective delete
4. **Score override persistence**: Score overrides are applied at import time but not stored separately
