# 5. Infection Control Tab - Context Document

## Purpose
This is an **assessment checklist** for evaluating the facility's infection prevention and control practices. Covers tracking/trending, antibiotic stewardship, immunizations, equipment cleaning, PPE use, and environmental cleanliness. Maximum score: **100 points**.

## Sheet Structure

### Header Section (Rows 1-4)
| Cell | Content | Notes |
|------|---------|-------|
| C2 | "Month:" | Label |
| D2 | Dropdown | Data validation: Lists!$D$3:$D$14 |

### Column Headers (Row 4)
| Column | Header | Notes |
|--------|--------|-------|
| B | "Category" | |
| C | "Max\nPoints" | |
| D | "# Met" | |
| E | "Sample\nSize" | |
| F | "\nPoints" | Note: Leading newline |
| G | "Notes" | Lowercase 'N' |

All with fill #CCCC00 (yellow), bold, centered

### Column Widths
| Column | Width |
|--------|-------|
| A | 3.88 |
| B | 48.5 |
| C | 8.63 |
| D | 13.0 |
| E | 13.0 |
| F | 13.0 |
| G | 47.88 |

### Section Header (Row 5)
**B5:G5** (merged): "Infection Control"

### Assessment Items (Rows 6-15)

| Row | Category | Max Pts | Sample | Multiplier | Formula |
|-----|----------|---------|--------|------------|---------|
| 6 | 1. Current infections are Tracked and Trended including mapping of infections and organism | 10 | Y=1 N=0 | 10 | =D6*10 |
| 7 | 2. CNO and ICP have implemented Antibiotic Stewardship Program with documentation of QAPI meeting that involves Medical Director | 10 | Y=1 N=0 | 10 | =D7*10 |
| 8 | 3. Immunization records for Flu/Pneumo/Covid-19 are current in PCC (Sample 3) | 10 | 3 | 3.34 | =D8*3.34 |
| 9 | 4. Observation of cleaning process of glucometers in between resident use with evidence of staff knowledge on dry times. Logs are accurate and maintained | 10 | 3 | 3.34 | =D9*3.34 |
| 10 | 5. Observation of cleaning process of vital sign equipment in between resident use with evidence of staff knowledge on dry times. (Observe 3) | 10 | 3 | 3.34 | =D10*3.34 |
| 11 | 6. Staff Sample: Appropriate PPE Use: Interview/Observe staff re: Adherence to precaution signs, appropriate use of PPE (including wearing appropriate PPE and donning/doffing appropriately) per CDC recommendations. F880 (Sample 3) | 10 | 3 | 3.34 | =D11*3.34 |
| 12 | 7. Resident Sample: Transmission Based Precautions: Facility follows CDC guidelines/policy regarding transmission based precautions. (i.e. EBP,TBP indicated for Cdiff, COVID-19, influenza, etc. per CDC guidelines etc.). F880 (Sample 3) | 10 | 3 | 3.33 | =D12*3.33 |
| 13 | 8. Facility implements hand washing/hygiene procedures to be followed by staff involved in direct resident contact and consistent with acceptable standards of practices. Universal precautions must be used in the care of all residents (observe 3 staff members). | 10 | 3 | 3.34 | =D13*3.34 |
| 14 | 9. Observation: Facility and equipment are clean. Yes/No (hoyers/med carts, doors, floors etc.) | 10 | Y=1 N=0 | 10 | =D14*10 |
| 15 | 10. Observation: Random shower room checks- shower room clean and free from dirty linens (Observe 3) | 10 | 3 | 3.34 | =D15*3.34 |

### Total Row (Row 16)
| Cell | Content | Formula |
|------|---------|---------|
| B16 | "Total Possible Score = 100            TOTAL SCORE:" | - |
| C16 | (calculated) | =SUM(C6:C15) |
| F16 | **Final Score** | =SUM(F6:F15) |

### Documentation Section (Rows 18-34)
| Row | Content |
|-----|---------|
| 18 | "Resident reviewed:" |
| 23 | "Comments:" |
| 34 | "Completed by:" and "Date:" |

## Data Validations
| Cell | Type | Formula/Values |
|------|------|----------------|
| D2 | List | Lists!$D$3:$D$14 (months) |
| D14 | List | "1,0" (Yes/No binary) |

Note: Items in rows 6 and 7 also use Y/N but validation may need to be added

## Merged Cells
- B5:G5 (Section header)

## Formula Multipliers Reference
| Max Points | Sample Size | Multiplier |
|------------|-------------|------------|
| 10 | Y/N (1) | 10 |
| 10 | 3 | 3.33-3.34 |

## Assessment Focus Areas

### Program Management (Items 1-2)
- Infection surveillance and tracking
- Infection mapping/trending
- Organism tracking
- Antibiotic Stewardship Program implementation
- CNO and ICP involvement
- QAPI meeting documentation
- Medical Director involvement

### Immunizations (Item 3)
- Flu vaccine records
- Pneumonia vaccine records
- COVID-19 vaccine records
- PCC (PointClickCare) documentation

### Equipment Cleaning (Items 4-5, 9)
- Glucometer cleaning between residents
- Staff knowledge on dry times
- Cleaning logs accuracy and maintenance
- Vital sign equipment cleaning
- General equipment cleanliness (hoyers, med carts, doors, floors)

### PPE and Isolation (Items 6-7)
- Staff PPE compliance
- Adherence to precaution signs
- Appropriate PPE selection
- Donning/doffing techniques
- CDC recommendations compliance
- F880 compliance
- Transmission-based precautions (EBP, TBP)
- Cdiff, COVID-19, influenza protocols

### Hand Hygiene (Item 8)
- Handwashing procedures
- Staff compliance with hygiene practices
- Universal precautions
- Direct resident contact standards
- Observe 3 staff members

### Environmental Cleanliness (Items 9-10, 14-15)
- Hoyers/lifts
- Med carts
- Doors
- Floors
- Shower rooms (random checks)
- Linen management (dirty linens)

## Key Regulatory References
- **F880**: CMS F-tag for infection control
- CDC infection control guidelines
- Antibiotic Stewardship Program requirements
- Transmission-based precaution standards

## Abbreviations Used
- **CNO**: Chief Nursing Officer
- **ICP**: Infection Control Practitioner
- **IP**: Infection Prevention
- **PPE**: Personal Protective Equipment
- **PCC**: PointClickCare (EHR system)
- **CDC**: Centers for Disease Control and Prevention
- **QAPI**: Quality Assurance and Performance Improvement
- **EBP**: Enhanced Barrier Precautions
- **TBP**: Transmission-Based Precautions

## Observation Checklist
The assessor should directly observe:
1. Infection tracking/mapping documentation
2. Glucometer cleaning process with dry time verification
3. Vital sign equipment cleaning with dry time verification
4. Staff PPE use during care (donning/doffing)
5. Hand hygiene practices (3 staff members)
6. Overall facility/equipment cleanliness
7. Shower room conditions (random checks of 3)

## User Instructions
1. Select month from dropdown
2. Review infection tracking documentation
3. Verify Antibiotic Stewardship Program evidence with QAPI documentation
4. Check immunization records in PCC for 3 residents
5. Observe equipment cleaning processes with staff interviews on dry times
6. Interview and observe 3 staff members on PPE/isolation (adherence to signs, donning/doffing)
7. Review transmission precautions for 3 residents (EBP/TBP for applicable conditions)
8. Observe hand hygiene compliance (3 staff during direct care)
9. Conduct environmental rounds (floors, doors, equipment)
10. Check 3 shower rooms for cleanliness and linen management
11. Document findings, residents reviewed, comments
12. Sign and date upon completion
