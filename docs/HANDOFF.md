# Handoff

## 2026-11-05 — session 1
- Built: lead AI analysis (native Odoo 20 AI + validated tools), website form /zayavka, CRM seed,
  quotation → project template (9 tasks), deadline + overdue escalation automations,
  Helpdesk AI triage + SLA, Ukrainian demo homepage, 18-case evaluation.
- Run order: `npm run check` → `seed:crm` → `seed:views` → `seed:ai` → `seed:website` → `seed:form`
  → `seed:sales` → `seed:project` → `seed:helpdesk` → `seed:homepage`; tests: `e2e:project`, `e2e:tickets`, `eval`.
- Env: `.env` with `ODOO_URL`, `ODOO_API_KEY` (never committed).
- Next: HR, meetings → tasks, internal AI assistant (Knowledge), purchase, docs, presentation.

## 2026-11-05 — session 2
- Built: HR applicant AI (05), meetings → draft tasks (06), internal AI assistant on Knowledge (07, needs ai_agentic),
  purchase RFQs from spec (08), partner reminders (09), AI site status report (10), finance report from CSV (11),
  marketing campaign report (12). All 10 assignment directions covered; full e2e regression passed.
- New scripts: seed:{hr,meetings,knowledge,purchase,partners,site-report,finance,marketing}, import:expenses,
  e2e:{applicants,meetings,purchase,partners,site-report,finance,marketing}.
- Next: cleanup of e2e data, UI walkthrough, presentation.
