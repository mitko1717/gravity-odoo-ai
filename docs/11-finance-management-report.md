# 11 — Finance: spreadsheet data → management report

## Problem
Project costs live in spreadsheets (crews, transport, subcontractors); revenue and purchases live in other places.
The owner sees project profitability late and only after manual consolidation.

## Solution
    data/expenses-demo.csv  (synthetic: date, object, category, amount)
    → npm run import:expenses     custom model x_gravity_expense «витрати по об’єктах (демо)», idempotent per source file
    → Knowledge article «Управлінський звіт по об’єктах (демо)», AI action «AI: управлінський звіт»
      → tool opsline_get_finance_data    per project: revenue (SO untaxed), purchases (RFQ/PO untaxed), expenses by category, margin
      → tool opsline_apply_finance_report rules build the table; AI writes conclusions, risks, recommendations
    → the report is written into the article (and becomes a source the internal assistant can cite)

## Why split rules and AI
All numbers are computed by rules and rendered by code; the LLM only comments. Observed during testing:
the commentary named ventilation subcontracting as the main margin driver for S00006, while the crew cost was
higher (96 000 vs 74 000). Figures in the table were correct. → AI text is labelled as a draft for review.

## Setup and test
    npm run seed:finance        # model, fields, access rule (Odoo 20: ir.access), article, AI action
    npm run import:expenses     # 10 rows; object 1..3 → 3 latest implementation projects
    npm run e2e:finance         # runs the AI action, prints the article

Verified 2026-11-05: 4 projects in the table; S00006 margin 38.8% flagged as the risk with concrete actions.

## Gotchas (Odoo 20 sandbox)
- `str.format` is forbidden in server actions; with %-formatting a literal percent must be `%%`.
- Odoo 20 replaced `ir.model.access` with `ir.access` (`operation: 'crud'`, `kind: 'permission'`).
- Knowledge has no action menu in the UI: the report is run via the API (or scheduled) for now.

## Roadmap
- Import from the real accounting / Google Sheets source on a schedule; monthly report run.
- Analytic accounts per project instead of the custom model; cash-flow and receivables sections.

## Known limitation: AI commentary wording

Rerun on 2026-11-05 after stand cleanup (objects mapped to projects 2, 7, 8). Numbers are correct (rule-based),
but the AI commentary sometimes mixes English field names and raw numbers ("margin 301001.0 UAH", "purchases")
and may omit a cost line (purchases for S00007 were not listed among risks). Fix in roadmap: pass Ukrainian labels
and pre-formatted amounts from the read tool and require every cost line in the prompt.
