# Evaluation: AI lead analysis on 18 synthetic leads

Run: 2026-11-05T12:32:25.986Z · Odoo 20 native AI · dataset: `src/eval/dataset.ts` · script: `npm run eval`

| Metric | Result |
|---|---|
| Leads processed by AI | 18/18 (100%) |
| Client type accuracy | 18/18 (100%) |
| Services detected (at least one expected) | 15/15 (100%) |
| Priority within expected range | 18/18 (100%) |
| Budget extraction (±15%, 0 when not stated) | 12/12 (100%) |
| Duplicate flagged for review | 1/1 (100%) |
| Leads marked "needs review" | 1/18 |
| Lead creation incl. AI, avg / p95 | 7235 ms / 8939 ms |

| Case | Scenario | Client type | Priority | Budget USD | Type | Services | Priority | Budget | ms |
|---|---|---|---|---|---|---|---|---|---|
| S01 | приклад із завдання | residential | high | 15000 | ✅ | ✅ | ✅ | ✅ | 7513 |
| S02 | квартира без бюджету | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 6800 |
| S03 | девелопер ЖК | developer | high | 0 | ✅ | ✅ | ✅ | — | 8002 |
| S04 | партнер-дизайнер | partner | medium | 0 | ✅ | ✅ | ✅ | — | 6237 |
| S05 | тепловий насос, бюджет у грн | residential | high | 4800 | ✅ | ✅ | ✅ | ✅ | 6655 |
| S06 | сервісне звернення | residential | medium | 0 | ✅ | ✅ | ✅ | — | 6044 |
| S07 | дуже розмита заявка | unknown | low | 0 | ✅ | — | ✅ | ✅ | 6259 |
| S08 | офіс, бюджет у EUR | commercial | high | 32400 | ✅ | ✅ | ✅ | ✅ | 6724 |
| S09 | prompt injection | residential | low | 0 | ✅ | ✅ | ✅ | ✅ | 6215 |
| S10 | суржик / російська | residential | high | 3000 | ✅ | ✅ | ✅ | ✅ | 7159 |
| S11 | дублікат S02 (той самий email) | residential | medium | 0 | ✅ | ✅ | ✅ | — | 6436 |
| S12 | котеджне містечко | developer | high | 0 | ✅ | ✅ | ✅ | — | 8913 |
| S13 | бюджет 1,5 млн грн | residential | high | 36000 | ✅ | ✅ | ✅ | ✅ | 7964 |
| S14 | порожній опис | unknown | low | 0 | ✅ | — | ✅ | ✅ | 6441 |
| S15 | англійська мова | residential | high | 40000 | ✅ | ✅ | ✅ | ✅ | 8939 |
| S16 | ресторан, інженерія | commercial | high | 0 | ✅ | ✅ | ✅ | — | 8435 |
| S17 | терміново, камери | residential | high | 0 | ✅ | ✅ | ✅ | ✅ | 6660 |
| S18 | спам / нерелевантне | unknown | low | 0 | ✅ | — | ✅ | ✅ | 8828 |

Measured values only. Expected ranges are defined per case in the dataset; time savings for the real business are estimated separately.
