# Evaluation: AI lead analysis on 18 synthetic leads

Run: 2026-11-13T06:43:02.866Z · Odoo 20 native AI · dataset: `src/eval/dataset.ts` · script: `npm run eval`

| Metric | Result |
|---|---|
| Leads processed by AI | 18/18 (100%) |
| Client type accuracy | 18/18 (100%) |
| Services detected (at least one expected) | 15/15 (100%) |
| Priority within expected range | 18/18 (100%) |
| Budget extraction (±15%, 0 when not stated) | 12/12 (100%) |
| Duplicate flagged for review | 1/1 (100%) |
| Leads marked "needs review" | 1/18 |
| Lead creation incl. AI, avg / p95 | 5205 ms / 6276 ms |

| Case | Scenario | Client type | Priority | Budget USD | Type | Services | Priority | Budget | ms |
|---|---|---|---|---|---|---|---|---|---|
| S01 | приклад із завдання | residential | high | 15000 | ✅ | ✅ | ✅ | ✅ | 5428 |
| S02 | квартира без бюджету | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 5222 |
| S03 | девелопер ЖК | developer | high | 0 | ✅ | ✅ | ✅ | — | 5396 |
| S04 | партнер-дизайнер | partner | medium | 0 | ✅ | ✅ | ✅ | — | 5693 |
| S05 | тепловий насос, бюджет у грн | residential | high | 4800 | ✅ | ✅ | ✅ | ✅ | 5004 |
| S06 | сервісне звернення | residential | medium | 0 | ✅ | ✅ | ✅ | — | 5220 |
| S07 | дуже розмита заявка | unknown | low | 0 | ✅ | — | ✅ | ✅ | 4876 |
| S08 | офіс, бюджет у EUR | commercial | high | 32400 | ✅ | ✅ | ✅ | ✅ | 5441 |
| S09 | prompt injection | residential | low | 0 | ✅ | ✅ | ✅ | ✅ | 6276 |
| S10 | суржик / російська | residential | high | 3000 | ✅ | ✅ | ✅ | ✅ | 4813 |
| S11 | дублікат S02 (той самий email) | residential | medium | 0 | ✅ | ✅ | ✅ | — | 4494 |
| S12 | котеджне містечко | developer | high | 0 | ✅ | ✅ | ✅ | — | 5127 |
| S13 | бюджет 1,5 млн грн | residential | high | 36000 | ✅ | ✅ | ✅ | ✅ | 5426 |
| S14 | порожній опис | unknown | low | 0 | ✅ | — | ✅ | ✅ | 4899 |
| S15 | англійська мова | residential | high | 40000 | ✅ | ✅ | ✅ | ✅ | 4850 |
| S16 | ресторан, інженерія | commercial | high | 0 | ✅ | ✅ | ✅ | — | 5139 |
| S17 | терміново, камери | residential | high | 0 | ✅ | ✅ | ✅ | ✅ | 5120 |
| S18 | спам / нерелевантне | unknown | low | 0 | ✅ | — | ✅ | ✅ | 5265 |

Measured values only. Expected ranges are defined per case in the dataset; time savings for the real business are estimated separately.
