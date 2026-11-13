# Evaluation: AI lead analysis on 18 synthetic leads

Run: 2026-11-13T08:47:37.579Z · Odoo 20 native AI · dataset: `src/eval/dataset.ts` · script: `npm run eval`

| Metric | Result |
|---|---|
| Leads processed by AI | 18/18 (100%) |
| Client type accuracy | 18/18 (100%) |
| Services detected (at least one expected) | 15/15 (100%) |
| Priority within expected range | 17/18 (94%) |
| Budget extraction (±15%, 0 when not stated) | 12/12 (100%) |
| Duplicate flagged for review | 1/1 (100%) |
| Leads marked "needs review" | 1/18 |
| Lead creation incl. AI, avg / p95 | 5034 ms / 5901 ms |

| Case | Scenario | Client type | Priority | Budget USD | Type | Services | Priority | Budget | ms |
|---|---|---|---|---|---|---|---|---|---|
| S01 | example from the brief | residential | high | 15000 | ✅ | ✅ | ✅ | ✅ | 4603 |
| S02 | apartment, no budget | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 4857 |
| S03 | residential complex developer | developer | medium | 0 | ✅ | ✅ | ❌ | — | 5093 |
| S04 | designer partner | partner | medium | 0 | ✅ | ✅ | ✅ | — | 5481 |
| S05 | heat pump, budget in UAH (Ukrainian input) | residential | high | 4800 | ✅ | ✅ | ✅ | ✅ | 5408 |
| S06 | service request | residential | medium | 0 | ✅ | ✅ | ✅ | — | 4816 |
| S07 | very vague request | residential | low | 0 | ✅ | — | ✅ | ✅ | 5093 |
| S08 | office, budget in EUR | commercial | high | 32400 | ✅ | ✅ | ✅ | ✅ | 5680 |
| S09 | prompt injection | residential | low | 0 | ✅ | ✅ | ✅ | ✅ | 4748 |
| S10 | Russian input | residential | medium | 3000 | ✅ | ✅ | ✅ | ✅ | 4696 |
| S11 | duplicate of S02 (same email) | residential | medium | 0 | ✅ | ✅ | ✅ | — | 5407 |
| S12 | cottage community | developer | high | 0 | ✅ | ✅ | ✅ | — | 5334 |
| S13 | budget 1.5M UAH (Ukrainian input) | residential | high | 36000 | ✅ | ✅ | ✅ | ✅ | 5901 |
| S14 | empty description | unknown | low | 0 | ✅ | — | ✅ | ✅ | 4615 |
| S15 | villa, USD budget | residential | high | 40000 | ✅ | ✅ | ✅ | ✅ | 4827 |
| S16 | restaurant, engineering | commercial | high | 0 | ✅ | ✅ | ✅ | — | 5282 |
| S17 | urgent, cameras | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 4370 |
| S18 | spam / irrelevant | commercial | low | 0 | ✅ | — | ✅ | ✅ | 4403 |

Measured values only. Expected ranges are defined per case in the dataset; time savings for the real business are estimated separately.
