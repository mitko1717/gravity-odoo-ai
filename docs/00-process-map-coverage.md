# 00. Coverage of Gravity's end-to-end process map

Source: `Gravity_naskrizna_karta_biznes_protsesiv.pdf` (10 stages + supporting processes).
This is an introductory map, not a confirmed description of Gravity's current tools.
Status: **done** = automated and verified by e2e, **partial** = native Odoo records only, **planned** = in progress.

| # | Stage | Result per map | Odoo modules | Automation | Status | Doc |
|---|---|---|---|---|---|---|
| 1 | Marketing and partners | New requests | Website, CRM, UTM | Website form → lead; campaign efficiency report; partner contact reminders | done | 02, 09, 12 |
| 2 | Sales | Agreed solution and price | CRM, Sales | AI lead analysis; quotation from template | done | 02, 03 |
| 3 | Sales and finance | Confirmed order | Sales, Invoicing, Sign | Order confirmation only; prepayment invoice and contract signing | planned | — |
| 4 | Design engineers | Ready design | Project, Sales | Task «Проєктування» and spec approval trigger; AI draft specification | planned | 03, 08 |
| 5 | PM / production | Implementation plan | Project, Planning | Project from template, 9 tasks, deadlines, escalation; crew planning | partial | 03 |
| 6 | Procurement | Everything needed | Purchase | Approved spec → draft RFQs per vendor | done | 08 |
| 7 | Installation crew | Installed system | Project, Field Service (if available) | AI site status report; field visits | partial | 10 |
| 8 | Engineers / commissioning | System works correctly | Project | Commissioning checklist and test protocol | planned | — |
| 9 | PM / client | Handed over to client | Project, Sign, Documents | Acceptance act and client handover email draft | planned | — |
| 10 | Service / support | Satisfied client | Helpdesk | AI ticket triage + SLA | done | 04 |

## Supporting processes

| Process | Automation | Status | Doc |
|---|---|---|---|
| HR | AI applicant profile, no automatic rejection | done | 05 |
| Finance | Spreadsheet → management report | done | 11 |
| Management / meetings | Transcript → summary → draft tasks | done | 06 |
| AI Hub | Internal assistant on Knowledge with citations | done | 07 |

This table is updated as each stage is closed.
