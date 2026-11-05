# Evaluation: AI lead analysis on 18 synthetic leads

Run: 2026-11-05T21:26:46.333Z · Odoo 20 native AI · dataset: `src/eval/dataset.ts` · script: `npm run eval`

| Metric | Result |
|---|---|
| Leads processed by AI | 18/18 (100%) |
| Client type accuracy | 18/18 (100%) |
| Services detected (at least one expected) | 15/15 (100%) |
| Priority within expected range | 18/18 (100%) |
| Budget extraction (±15%, 0 when not stated) | 12/12 (100%) |
| Duplicate flagged for review | 1/1 (100%) |
| Leads marked "needs review" | 1/18 |
| Lead creation incl. AI, avg / p95 | 6442 ms / 7324 ms |

| Case | Scenario | Client type | Priority | Budget USD | Type | Services | Priority | Budget | ms |
|---|---|---|---|---|---|---|---|---|---|
| S01 | приклад із завдання | residential | high | 15000 | ✅ | ✅ | ✅ | ✅ | 6215 |
| S02 | квартира без бюджету | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 6846 |
| S03 | девелопер ЖК | developer | high | 0 | ✅ | ✅ | ✅ | — | 6503 |
| S04 | партнер-дизайнер | partner | medium | 0 | ✅ | ✅ | ✅ | — | 6831 |
| S05 | тепловий насос, бюджет у грн | residential | high | 4800 | ✅ | ✅ | ✅ | ✅ | 6652 |
| S06 | сервісне звернення | residential | medium | 0 | ✅ | ✅ | ✅ | — | 5998 |
| S07 | дуже розмита заявка | unknown | low | 0 | ✅ | — | ✅ | ✅ | 5654 |
| S08 | офіс, бюджет у EUR | commercial | high | 32400 | ✅ | ✅ | ✅ | ✅ | 6198 |
| S09 | prompt injection | residential | low | 0 | ✅ | ✅ | ✅ | ✅ | 6088 |
| S10 | суржик / російська | residential | medium | 3000 | ✅ | ✅ | ✅ | ✅ | 6724 |
| S11 | дублікат S02 (той самий email) | residential | medium | 0 | ✅ | ✅ | ✅ | — | 6951 |
| S12 | котеджне містечко | developer | high | 0 | ✅ | ✅ | ✅ | — | 6891 |
| S13 | бюджет 1,5 млн грн | residential | high | 36000 | ✅ | ✅ | ✅ | ✅ | 7041 |
| S14 | порожній опис | unknown | low | 0 | ✅ | — | ✅ | ✅ | 5935 |
| S15 | англійська мова | residential | high | 40000 | ✅ | ✅ | ✅ | ✅ | 6418 |
| S16 | ресторан, інженерія | commercial | high | 0 | ✅ | ✅ | ✅ | — | 7324 |
| S17 | терміново, камери | residential | medium | 0 | ✅ | ✅ | ✅ | ✅ | 5442 |
| S18 | спам / нерелевантне | unknown | low | 0 | ✅ | — | ✅ | ✅ | 6240 |

Measured values only. Expected ranges are defined per case in the dataset; time savings for the real business are estimated separately.
