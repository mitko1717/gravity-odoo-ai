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

## 2026-11-05 — session 3
- Map stages 3, 4, 5/7, 8/9 closed (docs 13–16, `docs/00` coverage table): prepayment invoice + Sign templates, AI draft
  specification → RFQs from approved spec, crew shifts in Planning (`planning_field_service`), AI commissioning checklist,
  handover gate + AI client email draft.
- Website: Ukrainian footer as code (`odoo/website/footer-links.xml`), demo phone, text logo, CTA → /zayavka;
  quotation template field next to customer (`seed:quote-field`).
- Lead AI: form-vs-text area conflict rule. Site report ignores sub-tasks. Cleanup handles invoices, RFQs, shifts, duplicates.
- Telegram bot (`src/bot/`, `npm run bot`, local polling): lead/spec/RFQ/overdue/payment/handover/ticket/applicant
  notifications by role, action buttons, `/leads`, `/lead_ID`, `/stats`, `/digest`, `/request`, `/users`.
  Env: TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID, TELEGRAM_ALLOWED_CHAT_IDS, BOT_POLL_SECONDS, BOT_DIGEST_HOUR.
- Next: bot docs (local + Railway on Monday, then delete), doc cleanup, UI walkthrough end, presentation.

## 2026-11-08
Session 6: lead contact on create, booking→lead link, booking link button, weekly owner report (cron 75, /weekly), form-filled fields never missing, demo video 3:20, /demo command. Full handoff: claude.ai Project claude/HANDOFF-2026-11-08.md
