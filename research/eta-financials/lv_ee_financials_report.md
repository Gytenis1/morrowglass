# LV/EE furniture financial screening evidence

**Milestone:** `aa07bd01-7a7a-4df7-83e7-eecd495a9c4c`,
**Scope:** 25 named Estonian and Latvian furniture targets. All currency amounts are EUR.

## Method

- **Evidence basis:** free public-register-derived evidence only. Turnover and employee values below are the exact single-year values transcribed in the supplied registry-derived universe research; a missing value is not zero.
- **Estonia:** each row links to the official e-Business Register English record landing URL pattern (`https://ariregister.rik.ee/eng/company/<REGCODE>`). Automated retrieval was blocked with HTTP 403, so the corresponding public filed annual account must be re-opened from that record before diligence.
- **Latvia:** the official [Enterprise Register annual-report financial-data dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) is keyed by registration number. The [CKAN package API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati), [annual-report basic-data CSV](https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv), and [income-statement CSV](https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv) are official source landing/resource URLs. No unverified per-company registry URL is asserted.
- **EBITDA screening proxy:** where, and only where, the latest evidenced turnover is exact and current, `estimated proxy = reported turnover × 9%`. This is a conservative **estimate**, not filed EBITDA, operating profit, cash flow, or a normalized EBITDA measure. It is deliberately not applied to Silen, LUWO’s turnover range, or stale SC Koks and HOPPEKIDS turnover.
- **Operating profit and D&A:** neither was independently transcribed for this screening pass; both are null in the JSON rather than inferred. A proxy cannot substitute for those filed-account fields.

## Source limitations

- This is a screening record, not diligence. It contains only actually evidenced turnover years; no two- or three-year values, trends, or margins were invented.
- Industry labels are public screening descriptions. Specific current filed EMTAK/NACE codes need a live registry/account refresh.
- Latvian values should be refreshed from the daily official dataset before a transaction decision. SC Koks (FY2020) and HOPPEKIDS (FY2022) are stale; LUWO is a FY2024 range only. Estonia’s record landing pages require browser access because automated access was blocked.

## No-outreach record

**No outreach was performed.** No company, owner, broker, adviser, association, employee, or other person was contacted. This work used public sources only.

## Complete 25-row table

| # | Legal entity / registry code | Country | Industry / city or region | Evidenced turnover | Employees / availability | Operating profit / D&A | EBITDA screening result | Confidence | Official source |
|---:|---|---|---|---:|---|---|---|---|---|
| 1 | OÜ Merianto — `11009091` | Estonia | Healthcare, office and custom furniture<br>Tallinn, Harju | FY2024 €4,680,000 | 15 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €421,200 (9%) | Medium | [RIK record](https://ariregister.rik.ee/eng/company/11009091) |
| 2 | OÜ HARVIKER — `10325973` | Estonia | Plywood furniture and components<br>Jaluse, Rapla | FY2024 €7,450,000 | Not transcribed; single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €670,500 (9%) | Medium | [RIK record](https://ariregister.rik.ee/eng/company/10325973) |
| 3 | AS WERMO — `10051010` | Estonia | Case and home furniture<br>Võru, Võru | FY2024 €9,750,287 | 68 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €877,526 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/10051010) |
| 4 | OÜ Velma Mööbel — `10269832` | Estonia | Custom kitchen, office and contract furniture<br>Vahi, Tartu | FY2024 €4,206,056 | 52 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €378,545 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/10269832) |
| 5 | AS Antsla-Inno — `10081666` | Estonia | Upholstered furniture<br>Antsu, Võru | FY2024 €11,874,999 | 167 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €1,068,750 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/10081666) |
| 6 | OÜ Rave Mööbel — `10453530` | Estonia | Furniture and mirrors<br>Haapsalu, Lääne | FY2024 €4,813,543 | 54 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €433,219 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/10453530) |
| 7 | OÜ Ermatiko — `10225875` | Estonia | Contract and bespoke furniture<br>Tallinn, Harju | FY2024 €3,430,967 | 44 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €308,787 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/10225875) |
| 8 | Softrend Group OÜ — `11680682` | Estonia | Office and home furniture<br>Harku, Harju | FY2024 €4,061,486 | 37 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €365,534 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/11680682) |
| 9 | AS STANDARD — `10011051` | Estonia | Contract and hospitality interiors<br>Kose, Harju | FY2024 €8,415,045 | 44 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €757,354 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/10011051) |
| 10 | OÜ Bellus Furniture — `10229672` | Estonia | Upholstered furniture<br>Haljala, Lääne-Viru | FY2024 €11,791,631 | 126 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €1,061,247 (9%) | High | [RIK record](https://ariregister.rik.ee/eng/company/10229672) |
| 11 | Woodman OÜ — `11087048` | Estonia | Design furniture<br>Mäo, Järva | FY2024 €7,110,000 | Not transcribed; single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €639,900 (9%) | Medium | [RIK record](https://ariregister.rik.ee/eng/company/11087048) |
| 12 | Silen OÜ — `14506938` | Estonia | Acoustic office pods<br>Rae, Harju | FY2024 €14,890,702 | 57 (FY2024); single-year / availability note in JSON | Null / null (not independently transcribed) | Not derived | Medium | [RIK record](https://ariregister.rik.ee/eng/company/14506938) |
| 13 | SIA Rīgas Krēslu Fabrika — `50003439641` | Latvia | Chairs and seating<br>Riga | FY2025 €3,163,554 | 53 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €284,720 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 14 | SIA SENCIS — `47703000299` | Latvia | Wood furniture and components<br>Līvāni | FY2025 €2,598,717 | 52 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €233,885 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 15 | AS Elīza-K — `40003304327` | Latvia | Cabinet and bedroom furniture<br>Riga | FY2025 €5,462,262 | 75 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €491,604 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 16 | SIA Marks M — `43603011849` | Latvia | Upholstered furniture<br>Jelgava | FY2025 €2,420,945 | 59 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €217,885 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 17 | SIA SC Koks — `40003391875` | Latvia | Furniture; public directory screen NACE 3100<br>Sigulda factory footprint; Riga legal address | FY2020 €5,180,000 | Not transcribed; single-year / availability note in JSON | Null / null (not independently transcribed) | Not derived | Medium | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 18 | SIA BOLDERĀJA SERVISS — `40103082147` | Latvia | Furniture manufacturer; NACE refresh required<br>Riga | FY2023 €9,790,000 | Not transcribed; single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €881,100 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 19 | SIA LUWO — `43603025444` | Latvia | Other furniture (public screen 31.09)<br>Jelgava | FY2024 €5m–€20m (range) | 122 (FY2023); single-year / availability note in JSON | Null / null (not independently transcribed) | Not derived | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 20 | SIA HOPPEKIDS — `48503000187` | Latvia | Children’s furniture<br>Novadnieki, Saldus region | FY2022 €3,390,000 | Not transcribed; single-year / availability note in JSON | Null / null (not independently transcribed) | Not derived | Medium | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 21 | SIA Ansona mēbeļu fabrika — `40003360983` | Latvia | Furniture manufacturer and fitted furniture<br>Jaunmārupe, Mārupe | FY2025 €583,675 | 11 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €52,531 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 22 | SIA J. & K. Furniture — `40203218386` | Latvia | Furniture manufacturer<br>Daugavpils | FY2025 €575,157 | 15 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €51,764 (9%) | Medium | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 23 | SIA Alar Wood — `40103259072` | Latvia | Wood furniture and joinery<br>Jūrmala | FY2025 €525,170 | 15 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €47,265 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 24 | SIA INTEMA — `40103280006` | Latvia | Upholstered furniture<br>Riga | FY2025 €523,493 | 17 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €47,114 (9%) | Medium | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |
| 25 | SIA RAITA — `40103000348` | Latvia | Kitchen and cabinet furniture<br>Riga | FY2025 €1,278,780 | 17 (FY2025); single-year / availability note in JSON | Null / null (not independently transcribed) | Est. €115,090 (9%) | High | [UR dataset](https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati) · [API](https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati) |

### Row-level caveat key

- **Silen OÜ:** no generic 9% proxy was applied because the supplied registry-derived screen flags likely loss-making; filed P&L and D&A need review.
- **SIA LUWO:** FY2024 turnover is only €5m–€20m; the exact 2023 tax-record employee count is 122, while a later FY2024 range (101–300) is not a precise headcount.
- **SIA SC Koks and SIA HOPPEKIDS:** turnover is stale, respectively FY2020 and FY2022; no current proxy was calculated.
- **OÜ HARVIKER and Woodman OÜ:** FY2024 employee figures were not reliably transcribed; this is not a zero employee count.

## Inline complete JSON reproduction

The following is the full contents of `lv_ee_financials.json`, reproduced inline so this report is independently readable.

```json
{
  "title": "LV/EE furniture financial screening evidence",
  "milestone": "aa07bd01-7a7a-4df7-83e7-eecd495a9c4c",
  "scope": {
    "target_count": 25,
    "countries": [
      "Estonia",
      "Latvia"
    ],
    "evidence_standard": "Free public-register-derived evidence only; no outreach or contact."
  },
  "methodology": {
    "financial_metric_basis": "Reported turnover is recorded only for the fiscal year actually evidenced in the supplied registry-derived universe research. No multi-year series is inferred from a single year.",
    "ebitda_proxy_policy": "For latest exact turnover only, the estimated screening proxy is turnover × 9%. It is not filed EBITDA, operating profit, or normalized EBITDA. It is not used for Silen, a turnover range, or stale turnover evidence.",
    "operating_profit_and_da_policy": "Operating profit and depreciation/amortization are null unless independently transcribed from filed accounts. They were not independently transcribed for this 25-row screening set.",
    "estonia_source_method": "Official e-Business Register record landing URL pattern: https://ariregister.rik.ee/eng/company/<REGCODE>. Direct automated retrieval was blocked (HTTP 403); linked public filed annual accounts are the authoritative re-check source.",
    "latvia_source_method": "Latvian Enterprise Register annual-report financial-data dataset on data.gov.lv. Registration number is the record/join key; source links include the dataset API plus official basic-data and income-statement resources.",
    "no_outreach": "No company, owner, broker, adviser, association, employee, or other person was contacted. This is desk research only."
  },
  "targets": [
    {
      "legal_name": "OÜ Merianto",
      "country": "Estonia",
      "registry_code": "11009091",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Healthcare, office and custom furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Tallinn, Harju",
      "employees_latest": {
        "value": 15,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 4680000,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 421200.0,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €4,680,000 × 0.09 = €421,200.00; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "Medium",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/11009091"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "OÜ HARVIKER",
      "country": "Estonia",
      "registry_code": "10325973",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Plywood furniture and components",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Jaluse, Rapla",
      "employees_latest": {
        "value": null,
        "year": null,
        "availability": "FY2024 employee count was not reliably transcribed in the supplied public-universe research.",
        "trend_availability": "Employee count was not transcribed; no employee trend is available."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 7450000,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 670500.0,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €7,450,000 × 0.09 = €670,500.00; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "Medium",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10325973"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "AS WERMO",
      "country": "Estonia",
      "registry_code": "10051010",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Case and home furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Võru, Võru",
      "employees_latest": {
        "value": 68,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 9750287,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 877525.83,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €9,750,287 × 0.09 = €877,525.83; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10051010"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "OÜ Velma Mööbel",
      "country": "Estonia",
      "registry_code": "10269832",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Custom kitchen, office and contract furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Vahi, Tartu",
      "employees_latest": {
        "value": 52,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 4206056,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 378545.04,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €4,206,056 × 0.09 = €378,545.04; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10269832"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "AS Antsla-Inno",
      "country": "Estonia",
      "registry_code": "10081666",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Upholstered furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Antsu, Võru",
      "employees_latest": {
        "value": 167,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 11874999,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 1068749.91,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €11,874,999 × 0.09 = €1,068,749.91; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10081666"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "OÜ Rave Mööbel",
      "country": "Estonia",
      "registry_code": "10453530",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Furniture and mirrors",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Haapsalu, Lääne",
      "employees_latest": {
        "value": 54,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 4813543,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 433218.87,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €4,813,543 × 0.09 = €433,218.87; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10453530"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "OÜ Ermatiko",
      "country": "Estonia",
      "registry_code": "10225875",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Contract and bespoke furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Tallinn, Harju",
      "employees_latest": {
        "value": 44,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 3430967,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 308787.03,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €3,430,967 × 0.09 = €308,787.03; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10225875"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "Softrend Group OÜ",
      "country": "Estonia",
      "registry_code": "11680682",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Office and home furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Harku, Harju",
      "employees_latest": {
        "value": 37,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 4061486,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 365533.74,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €4,061,486 × 0.09 = €365,533.74; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/11680682"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "AS STANDARD",
      "country": "Estonia",
      "registry_code": "10011051",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Contract and hospitality interiors",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Kose, Harju",
      "employees_latest": {
        "value": 44,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 8415045,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 757354.05,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €8,415,045 × 0.09 = €757,354.05; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10011051"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "OÜ Bellus Furniture",
      "country": "Estonia",
      "registry_code": "10229672",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Upholstered furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Haljala, Lääne-Viru",
      "employees_latest": {
        "value": 126,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 11791631,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 1061246.79,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €11,791,631 × 0.09 = €1,061,246.79; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/10229672"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "Woodman OÜ",
      "country": "Estonia",
      "registry_code": "11087048",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Design furniture",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Mäo, Järva",
      "employees_latest": {
        "value": null,
        "year": null,
        "availability": "FY2024 employee count was not reliably transcribed in the supplied public-universe research.",
        "trend_availability": "Employee count was not transcribed; no employee trend is available."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 7110000,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 639900.0,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2024 reported turnover × 9% = €7,110,000 × 0.09 = €639,900.00; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "Medium",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/11087048"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "Silen OÜ",
      "country": "Estonia",
      "registry_code": "14506938",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Acoustic office pods",
        "limitation": "Specific current EMTAK/NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Rae, Harju",
      "employees_latest": {
        "value": 57,
        "year": 2024,
        "availability": "FY2024 employee figure surfaced in the public annual-account screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": 14890702,
          "evidence_note": "FY2024 reported turnover surfaced from public annual-account screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": null,
      "ebitda_proxy_status": "not_derived",
      "formula": "No proxy: the supplied public-universe research flags this business as likely loss-making; operating profit and D&A were not independently transcribed, so a generic revenue-margin estimate would be misleading.",
      "ebitda_margin": null,
      "ebitda_margin_note": "No EBITDA margin can be derived without company-level operating profit and D&A.",
      "confidence": "Medium",
      "source_urls": [
        "https://ariregister.rik.ee/eng/company/14506938"
      ],
      "source_notes": "Official record landing URL follows the Estonian e-Business Register English record pattern for this registry code. The supplied public-universe research transcribed the FY2024 turnover (and, where present, employees) from the linked public annual-account route. Direct automated retrieval of the record URL was blocked (HTTP 403), so the filed annual report remains the authoritative re-check source."
    },
    {
      "legal_name": "SIA Rīgas Krēslu Fabrika",
      "country": "Latvia",
      "registry_code": "50003439641",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Chairs and seating",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Riga",
      "employees_latest": {
        "value": 53,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 3163554,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 284719.86,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €3,163,554 × 0.09 = €284,719.86; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "SIA SENCIS",
      "country": "Latvia",
      "registry_code": "47703000299",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Wood furniture and components",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Līvāni",
      "employees_latest": {
        "value": 52,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 2598717,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 233884.53,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €2,598,717 × 0.09 = €233,884.53; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "AS Elīza-K",
      "country": "Latvia",
      "registry_code": "40003304327",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Cabinet and bedroom furniture",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Riga",
      "employees_latest": {
        "value": 75,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 5462262,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 491603.58,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €5,462,262 × 0.09 = €491,603.58; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "SIA Marks M",
      "country": "Latvia",
      "registry_code": "43603011849",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Upholstered furniture",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Jelgava",
      "employees_latest": {
        "value": 59,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 2420945,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 217885.05,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €2,420,945 × 0.09 = €217,885.05; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "SIA SC Koks",
      "country": "Latvia",
      "registry_code": "40003391875",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Furniture; public directory screen NACE 3100",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Sigulda factory footprint; Riga legal address",
      "employees_latest": {
        "value": null,
        "year": null,
        "availability": "Employee figure was not available in the evidence transcribed for this screening pass.",
        "trend_availability": "Employee count was not transcribed; no employee trend is available."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2020,
          "turnover_eur": 5180000,
          "evidence_note": "FY2020 reported turnover transcribed from public official-universe work; stale single-year evidence."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": null,
      "ebitda_proxy_status": "not_derived",
      "formula": "No EBITDA proxy was derived from the available evidence.",
      "ebitda_margin": null,
      "ebitda_margin_note": "No EBITDA margin can be derived from the available evidence.",
      "confidence": "Medium",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass. FY2020 turnover is stale; it should not be used as a current sizing measure."
    },
    {
      "legal_name": "SIA BOLDERĀJA SERVISS",
      "country": "Latvia",
      "registry_code": "40103082147",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Furniture manufacturer; NACE refresh required",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Riga",
      "employees_latest": {
        "value": null,
        "year": null,
        "availability": "Employee figure was not available in the evidence transcribed for this screening pass.",
        "trend_availability": "Employee count was not transcribed; no employee trend is available."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2023,
          "turnover_eur": 9790000,
          "evidence_note": "FY2023 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 881100.0,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2023 reported turnover × 9% = €9,790,000 × 0.09 = €881,100.00; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass. FY2023 is the only turnover year transcribed; current NACE/product mix needs refresh."
    },
    {
      "legal_name": "SIA LUWO",
      "country": "Latvia",
      "registry_code": "43603025444",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Other furniture (public screen 31.09)",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Jelgava",
      "employees_latest": {
        "value": 122,
        "year": 2023,
        "availability": "122 tax-record employees in 2023. A later public FY2024 employee range of 101–300 was noted, but no precise FY2024 figure was transcribed.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2024,
          "turnover_eur": null,
          "turnover_range_eur": {
            "minimum": 5000000,
            "maximum": 20000000
          },
          "evidence_note": "FY2024 public turnover range: €5m–€20m; no exact turnover value transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": null,
      "ebitda_proxy_status": "not_derived",
      "formula": "No EBITDA proxy was derived from the available evidence.",
      "ebitda_margin": null,
      "ebitda_margin_note": "No EBITDA margin can be derived from the available evidence.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass. FY2024 turnover is only a public range (€5m–€20m), not an exact amount; no false-precision proxy has been calculated."
    },
    {
      "legal_name": "SIA HOPPEKIDS",
      "country": "Latvia",
      "registry_code": "48503000187",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Children’s furniture",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Novadnieki, Saldus region",
      "employees_latest": {
        "value": null,
        "year": null,
        "availability": "Employee figure was not available in the evidence transcribed for this screening pass.",
        "trend_availability": "Employee count was not transcribed; no employee trend is available."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2022,
          "turnover_eur": 3390000,
          "evidence_note": "FY2022 reported turnover transcribed from public official-universe work; stale single-year evidence."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": null,
      "ebitda_proxy_status": "not_derived",
      "formula": "No EBITDA proxy was derived from the available evidence.",
      "ebitda_margin": null,
      "ebitda_margin_note": "No EBITDA margin can be derived from the available evidence.",
      "confidence": "Medium",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass. FY2022 turnover is stale; it should not be used as a current sizing measure."
    },
    {
      "legal_name": "SIA Ansona mēbeļu fabrika",
      "country": "Latvia",
      "registry_code": "40003360983",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Furniture manufacturer and fitted furniture",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Jaunmārupe, Mārupe",
      "employees_latest": {
        "value": 11,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 583675,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 52530.75,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €583,675 × 0.09 = €52,530.75; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "SIA J. & K. Furniture",
      "country": "Latvia",
      "registry_code": "40203218386",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Furniture manufacturer",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Daugavpils",
      "employees_latest": {
        "value": 15,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 575157,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 51764.13,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €575,157 × 0.09 = €51,764.13; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "Medium",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "SIA Alar Wood",
      "country": "Latvia",
      "registry_code": "40103259072",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Wood furniture and joinery",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Jūrmala",
      "employees_latest": {
        "value": 15,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 525170,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 47265.3,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €525,170 × 0.09 = €47,265.30; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "SIA INTEMA",
      "country": "Latvia",
      "registry_code": "40103280006",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Upholstered furniture",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Riga",
      "employees_latest": {
        "value": 17,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 523493,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 47114.37,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €523,493 × 0.09 = €47,114.37; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "Medium",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    },
    {
      "legal_name": "SIA RAITA",
      "country": "Latvia",
      "registry_code": "40103000348",
      "nace_industry": {
        "nace_code": null,
        "industry_screen": "Kitchen and cabinet furniture",
        "limitation": "Specific filed NACE code was not independently transcribed; this is the public furniture/industry screen description."
      },
      "city_region": "Riga",
      "employees_latest": {
        "value": 17,
        "year": 2025,
        "availability": "FY2025 average employee figure surfaced in the official annual-report screen.",
        "trend_availability": "Single-year evidence only; no multi-year employee trend was transcribed."
      },
      "turnover_by_year": [
        {
          "fiscal_year": 2025,
          "turnover_eur": 1278780,
          "evidence_note": "FY2025 reported turnover transcribed from the official annual-report screening; this is the only turnover year transcribed."
        }
      ],
      "operating_profit": null,
      "operating_profit_limitation": "Operating profit was not independently transcribed from the filed income statement in this screening pass; do not treat turnover as operating profit.",
      "depreciation_amortization": null,
      "depreciation_amortization_limitation": "Depreciation and amortization were not independently transcribed from the filed accounts in this screening pass.",
      "ebitda_proxy": 115090.2,
      "ebitda_proxy_status": "estimated_screening_proxy",
      "formula": "Estimated screening proxy = FY2025 reported turnover × 9% = €1,278,780 × 0.09 = €115,090.20; not filed EBITDA.",
      "ebitda_margin": 0.09,
      "ebitda_margin_note": "Estimated screening margin only; not a reported or normalized EBITDA margin.",
      "confidence": "High",
      "source_urls": [
        "https://data.gov.lv/dati/dataset/gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/api/3/action/package_show?id=gada-parskatu-finansu-dati",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/27fcc5ec-c63b-4bfd-bb08-01f073a52d04/download/financial_statements.csv",
        "https://data.gov.lv/dati/dataset/8d31b878-536a-44aa-a013-8bc6b669d477/resource/d5fd17ef-d32e-40cb-8399-82b780095af0/download/income_statements.csv"
      ],
      "source_notes": "Official Latvian Enterprise Register annual-report financial-data dataset. The registration number is the join key across annual-report header/basic data and income-statement data. The supplied public-universe research transcribed the stated turnover and employee evidence. No company-specific direct registry landing URL is asserted because one was not independently verified in this pass."
    }
  ]
}
```
