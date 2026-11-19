# 03 — Quotation → Sales order → Project → Tasks → Overdue escalation

## Flow

1. Manager opens the qualified lead → **New Quotation** → field **Template** (tab "Other Info")
   → «Smart home: basic proposal (demo)». Lines and tags are copied from the lead.
2. **Confirm** → Odoo natively creates a project from «Template: smart home implementation»
   (product «Smart home implementation (work package)» has *Create on Order = Project*).
   No custom code is involved in this step.
3. Automation **«Opsline: project task deadlines»** (project.task, on create) sets planned deadlines.
4. Automation **«Opsline: overdue task escalation»** (1 day after deadline, unfinished tasks)
   creates an activity for the project manager and posts a chatter note.

## Project template

9 tasks with sequential dependencies ("Blocked by"), stages: To do → In progress → In review → Done.

| # | Task | Deadline (days from start, demo assumption) |
|---|---|---|
| 1 | Clarify technical requirements | 2 |
| 2 | Site visit | 5 |
| 3 | System design | 12 |
| 4 | Specification approval with client | 15 |
| 5 | Equipment purchasing | 25 |
| 6 | Installation | 35 |
| 7 | Configuration and programming | 40 |
| 8 | System testing | 42 |
| 9 | Handover and client training | 45 |

## Demo catalog

All products are services marked **[demo price]**; prices are placeholders, not real prices.
The package line (1 ₴) is a technical marker that triggers project creation.

## Verified (`npm run e2e:project`)

order S00003 -> project 3, tasks: 9
2026-11-07 blocked by 0 Clarify technical requirements
...
2026-12-20 blocked by 1 Handover and client training
escalation activities: [ 'Overdue: Clarify technical requirements -> dm h' ]


## Notes and limitations

- Quotation templates have no settings toggle in Odoo 20; the field is labelled "Template".
- Creating an order through the API does not run the template onchange, so the e2e script copies template lines explicitly.
- Server action code runs in a sandbox: no attribute assignment (`record.field = x`), use `record.write({...})`.
- Overdue checks run on the Odoo automation cron (hourly on Odoo Online); the e2e test triggers it manually.
