# Evaluation: AI lead analysis on 18 synthetic leads

Run: 2026-11-13T07:27:45.555Z · Odoo 20 native AI · dataset: `src/eval/dataset.ts` · script: `npm run eval`

| Metric | Result |
|---|---|
| Leads processed by AI | 18/18 (100%) |
| Client type accuracy | 18/18 (100%) |
| Services detected (at least one expected) | 15/15 (100%) |
| Priority within expected range | 16/18 (89%) |
| Budget extraction (±15%, 0 when not stated) | 12/12 (100%) |
| Duplicate flagged for review | 1/1 (100%) |
| Leads marked "needs review" | 1/18 |
| Lead creation incl. AI, avg / p95 | 4999 ms / 5735 ms |

| Case | Scenario | Client type | Priority | Budget USD | Type | Services | Priority | Budget | ms |
|---|---|---|---|---|---|---|---|---|---|
| S01 | example from the brief | residential | high | 15000 | ✅ | ✅ | ✅ | ✅ | 4930 |
| S02 | apartment, no budget | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 4774 |
| S03 | residential complex developer | developer | medium | 0 | ✅ | ✅ | ❌ | — | 5451 |
| S04 | designer partner | partner | medium | 0 | ✅ | ✅ | ✅ | — | 4711 |
| S05 | heat pump, budget in UAH (Ukrainian input) | residential | high | 4800 | ✅ | ✅ | ✅ | ✅ | 4628 |
| S06 | service request | residential | low | 0 | ✅ | ✅ | ❌ | — | 4518 |
| S07 | very vague request | unknown | low | 0 | ✅ | — | ✅ | ✅ | 4275 |
| S08 | office, budget in EUR | commercial | high | 32400 | ✅ | ✅ | ✅ | ✅ | 4767 |
| S09 | prompt injection | residential | low | 0 | ✅ | ✅ | ✅ | ✅ | 5278 |
| S10 | Russian input | residential | medium | 3000 | ✅ | ✅ | ✅ | ✅ | 5535 |
| S11 | duplicate of S02 (same email) | residential | low | 0 | ✅ | ✅ | ✅ | — | 5069 |
| S12 | cottage community | developer | high | 0 | ✅ | ✅ | ✅ | — | 5735 |
| S13 | budget 1.5M UAH (Ukrainian input) | residential | high | 36000 | ✅ | ✅ | ✅ | ✅ | 5352 |
| S14 | empty description | unknown | low | 0 | ✅ | — | ✅ | ✅ | 5478 |
| S15 | villa, USD budget | residential | high | 40000 | ✅ | ✅ | ✅ | ✅ | 5419 |
| S16 | restaurant, engineering | commercial | medium | 0 | ✅ | ✅ | ✅ | — | 4313 |
| S17 | urgent, cameras | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 4551 |
| S18 | spam / irrelevant | unknown | low | 0 | ✅ | — | ✅ | ✅ | 5190 |

Measured values only. Expected ranges are defined per case in the dataset; time savings for the real business are estimated separately.
