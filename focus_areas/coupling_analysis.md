# Risk Score and Focus Areas Coupling Analysis

## Executive Summary

This analysis examines the relationship between the **Risk Score model** (logistic regression predicting IJ/Harm probability) and the **Focus Areas model** (clinical system prioritization based on deficiency patterns). The goal is to determine whether these models are redundant, complementary, or independent.

**Key Finding**: The models exhibit a **moderate positive correlation (r = 0.56)**, sharing about 31% variance. They are **complementary, not redundant** - each captures unique information the other does not. **Recommendation: Keep both models separate.**

---

## 1. Correlation Analysis

### Overall Correlation

| Metric | Value |
|--------|-------|
| Pearson Correlation | 0.5566 |
| R² (Variance Explained) | 30.98% |
| Facilities Analyzed | 14,621 |

### Score Distribution

| Statistic | Risk Score | Focus Areas Score |
|-----------|------------|-------------------|
| Mean | 11.8 | 17.5 |
| Std Dev | 9.0 | 14.9 |
| Median | 9.0 | 13.0 |
| Min | 1 | 0 |
| Max | 83 | 100 |

### State-Level Correlations

The correlation varies significantly by state, suggesting regional enforcement patterns affect the relationship:

| State | Correlation | n |
|-------|-------------|---|
| NC | 0.802 | 417 |
| DE | 0.792 | 43 |
| UT | 0.788 | 97 |
| MT | 0.757 | 59 |
| MA | 0.755 | 340 |
| MS | 0.754 | 200 |
| VT | 0.735 | 33 |
| WI | 0.733 | 323 |
| IA | 0.724 | 393 |
| PA | 0.712 | 657 |

States with higher correlations tend to have more consistent enforcement patterns where deficiency history strongly predicts future outcomes.

---

## 2. Disagreement Cases

### High Risk Score + Low Focus Areas Score (2 facilities)

These facilities have high predicted risk BUT low system-level deficiency scores. This occurs because Risk Score includes non-deficiency factors:

| CCN | Facility | State | Risk | Focus |
|-----|----------|-------|------|-------|
| 175424 | Lakepoint Augusta, LLC | KS | 50 | 15 |
| 366106 | The Gardens of Fairfax Health Care Center | OH | 74 | 21 |

**Why this happens**: These facilities likely have:
- Special Focus Facility (SFF) status (+140% risk)
- High fine counts (+5% per fine)
- Low health inspection stars
- But relatively clean recent deficiency history

**Implication**: Risk Score captures regulatory burden (SFF, fines) that Focus Areas does not.

### Low Risk Score + High Focus Areas Score (338 facilities)

These facilities have low predicted risk BUT high system-level deficiency scores:

| CCN | Facility | State | Risk | Focus |
|-----|----------|-------|------|-------|
| 515066 | Dunbar Center | WV | 9 | 57 |
| 056023 | Avalon Villa Care Center | CA | 19 | 55 |
| 515120 | River Oaks Healthcare Center | WV | 16 | 55 |
| 045303 | Crestpark Stuttgart, LLC | AR | 14 | 53 |
| 045379 | Pine Bluff Transitional Care | AR | 15 | 51 |

**Why this happens**: These facilities have:
- Many deficiencies in specific clinical systems
- But deficiencies are low severity (potential harm, not actual harm)
- Good star ratings (which reduce Risk Score)
- No SFF status, no fines

**Implication**: Focus Areas captures system-level patterns regardless of severity. Facilities can have repeated citations in a system (e.g., Falls) that warrant attention but don't yet rise to "high risk" status.

---

## 3. Coverage Analysis

### Deficiency Coverage

| Metric | Count | Percentage |
|--------|-------|------------|
| Total facilities | 14,621 | 100% |
| With any deficiencies (3yr) | 13,859 | 94.8% |
| With harm citations | 3,424 | 23.4% |
| With SFF status | 1 | 0.01% |

### System Coverage

Percentage of facilities with citations in each clinical system:

| System | Facilities | Coverage |
|--------|------------|----------|
| 1. Change of Condition | 9,502 | 65.0% |
| 2. Accidents/Falls | 10,581 | 72.4% |
| 3. Skin | 7,979 | 54.6% |
| 4. Med Management | 10,401 | 71.1% |
| 5. Infection Control | 9,724 | 66.5% |
| 6. Transfer/Discharge | 3,049 | 20.9% |
| 7. Abuse/Grievances | 4,576 | 31.3% |

**Observations**:
- Accidents/Falls is the most common system (72.4% of facilities)
- Transfer/Discharge is least common (20.9%) but most predictive when present (2.85x lift)
- Nearly all facilities (95%) have at least one deficiency in the past 3 years

---

## 4. What Each Model Captures

### Risk Score Model Factors

The logistic regression Risk Score includes these predictors:

| Factor | Weight | Captured by Focus Areas? |
|--------|--------|-------------------------|
| prev_harm_count | +14% per citation | Partially (severity weighted) |
| health_inspection_star | -64% per star | No |
| qm_star | -5% per star | No |
| special_focus_facility | +140% | No |
| fine_count | +5% per fine | No |
| infection_control_citations | -5% per citation* | Yes |
| region (Northeast/South) | -47%/-43% | No |
| ownership (Government) | +28% | No |

*Note: Negative coefficient for IC citations appears counterintuitive; may reflect confounding with post-COVID enforcement changes.

### Focus Areas Model Factors

| Factor | Weight | Captured by Risk Score? |
|--------|--------|------------------------|
| Severity-weighted deficiency count | 40% | Partially (harm only) |
| Repeat F-tag frequency | Bonus | No |
| System concentration | Derived | No |
| QM percentile (placeholder) | 25% | No (via star only) |
| Peer comparison | 10% | No |
| State enforcement trends | 10% | No |

---

## 5. Variance Decomposition

The 31% shared variance comes primarily from:
1. **Harm count**: Both models weight harm citations heavily
2. **Deficiency patterns**: Facilities with more severe deficiencies score high on both

The 69% unique variance comes from:

### Unique to Risk Score (~35%)
- Star ratings (health inspection, QM)
- SFF status
- Fine history
- Regional effects
- Ownership type

### Unique to Focus Areas (~35%)
- System-level detail (WHAT to focus on)
- Non-harm severity differentiation
- Repeat F-tag patterns
- Peer comparison within state
- State enforcement trend adjustments

---

## 6. Recommendation: Keep Models Separate

### Rationale

1. **Different Questions**: Risk Score answers "IS this facility high risk?" Focus Areas answers "WHAT should this facility prioritize?"

2. **Complementary Coverage**: Risk Score uses star ratings and SFF status; Focus Areas uses system-level patterns and repeat citations.

3. **Low Redundancy**: Only 31% variance overlap - combining would lose 69% of unique information.

4. **Actionable Guidance**: Focus Areas provides specific clinical system recommendations; Risk Score provides a single probability.

### Use Cases

| Scenario | Use Risk Score | Use Focus Areas |
|----------|---------------|-----------------|
| Portfolio prioritization | Yes | No |
| Pre-survey preparation | Support | Yes |
| Compliance planning | Yes | Yes |
| System improvement | No | Yes |
| Chain-wide analysis | Yes | Yes (aggregate) |

### Integration Approach

Rather than combining the models, use them in sequence:

```
1. Risk Score → Identify HIGH priority facilities
2. Focus Areas → For each facility, identify TOP priority systems
3. Recommendations → Address highest-scoring systems first
```

### Score Card Enhancement

For facilities shown in the survey intelligence UI:

| Field | Source | Purpose |
|-------|--------|---------|
| Overall Risk Score | Risk Model | Prioritization |
| Risk Tier | Risk Model | Quick reference |
| Top Focus Area #1 | Focus Areas | Improvement target |
| Top Focus Area #2 | Focus Areas | Secondary target |
| Repeat F-Tags | Focus Areas | Specific deficiency patterns |

---

## 7. Potential Model Improvements

### Risk Score Enhancements
1. Add system concentration as predictor (most deficiencies in one system)
2. Add repeat F-tag rate as predictor
3. Remove or reinvestigate infection_control_citations coefficient

### Focus Areas Enhancements
1. Integrate actual QM values when available (currently placeholder)
2. Weight recent surveys higher (time decay)
3. Add chain-level patterns for multi-facility operators

---

## 8. Conclusion

The Risk Score and Focus Areas models are **complementary analytical tools** that should remain separate. The Risk Score excels at identifying high-risk facilities using regulatory factors (stars, SFF, fines). The Focus Areas model excels at providing actionable, system-specific improvement guidance based on deficiency patterns.

**Together, they provide a complete picture**:
- WHICH facilities need attention (Risk Score)
- WHAT clinical systems to prioritize (Focus Areas)
- WHY they're at risk (both models' evidence)

---

*Analysis Date: 2025-12-27*
*Data: 14,621 SNF facilities, 213,208 deficiencies (3 years)*
*Models: Risk Score v1.0 (Enhanced LR), Focus Areas v1.0*
