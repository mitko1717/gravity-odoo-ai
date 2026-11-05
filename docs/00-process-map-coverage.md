# 00. Coverage of Gravity's end-to-end process map

Source: `Gravity_naskrizna_karta_biznes_protsesiv.pdf` (10 stages + supporting processes).
This is an introductory map, not a confirmed description of Gravity's current tools.
Status: **done** = automated and verified by e2e, **partial** = native Odoo records only, **planned** = in progress.

| # | Stage | Result per map | Odoo modules | Automation | Status | Doc |
|---|---|---|---|---|---|---|
| 1 | Marketing and partners | New requests | Website, CRM, UTM | Website form → lead; campaign efficiency report; partner contact reminders | done | 02, 09, 12 |
| 2 | Sales | Agreed solution and price | CRM, Sales | AI lead analysis; quotation from template | done | 02, 03 |
| 3 | Sales and finance | Confirmed order | Sales, Invoicing, Sign | Order confirmed → draft 30% prepayment invoice + activity to send the contract (Sign template); payment → PM activity | done | 13 |
| 4 | Design engineers | Ready design | Project, Purchase | AI draft specification from catalog → engineer approves → RFQs from the approved spec | done | 14, 08 |
| 5 | PM / production | Implementation plan | Project, Planning | Project from template, 9 tasks, deadlines, escalation; draft crew shifts per field task | done | 03, 15 |
| 6 | Procurement | Everything needed | Purchase | Approved spec → draft RFQs per vendor | done | 08 |
| 7 | Installation crew | Installed system | Project, Planning (Field Service) | Field visits as planned shifts; AI site status report | done | 15, 10 |
| 8 | Engineers / commissioning | System works correctly | Project | AI commissioning checklist from the approved spec (sub-tasks) | done | 16 |
| 9 | PM / client | Handed over to client | Project, Sign | Gate: all checks closed → PM activity; Sign acceptance act; AI handover email draft | done | 16 |
| 10 | Service / support | Satisfied client | Helpdesk | AI ticket triage + SLA | done | 04 |

## Supporting processes

| Process | Automation | Status | Doc |
|---|---|---|---|
| HR | AI applicant profile, no automatic rejection | done | 05 |
| Finance | Spreadsheet → management report | done | 11 |
| Management / meetings | Transcript → summary → draft tasks | done | 06 |
| AI Hub | Internal assistant on Knowledge with citations | done | 07 |

## Measured quality

Lead AI on 18 synthetic leads: 18/18 client type and priority, 15/15 services, 12/12 budgets, duplicate and prompt
injection handled, ~7 s per lead. Details: [eval-results.md](eval-results.md). Other features are verified by e2e
scripts (see each doc's «Verified» section).

This table is updated as each stage is closed.
