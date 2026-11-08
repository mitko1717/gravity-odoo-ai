# Gravity × Odoo × AI — end-to-end automation prototype

Unofficial demo prototype built as a test assignment for the AI Builder role at Gravity
(smart home, electrical and engineering systems, Ukraine). Not affiliated with or endorsed
by Gravity; all customer, partner, candidate and financial data is synthetic.

## What it shows

Website form → CRM lead with AI analysis → quotation → sales order → project with 9 standard tasks,
deadlines and overdue escalation → approved specification → draft purchase orders → AI site status report →
service tickets with AI triage and SLA. Plus HR, meetings, internal AI assistant, partners and finance.

## Principles

- Native Odoo 20 first; configuration as code via the JSON-2 API (idempotent seed scripts).
- The LLM never writes records directly: it calls a tool with a strict JSON schema, Python validates and writes.
- Numbers, statuses and percentages are computed by rules; AI writes text and recommendations only.
- AI only where it adds value: procurement and partner reminders are plain rules on purpose.
- Customer / candidate / field text is treated as untrusted input (prompt injection tested in e2e).
- Humans decide: drafts, recommendations and activities, never automatic rejection or sending.

## Measured results

AI lead analysis on 18 synthetic leads (incl. vague, duplicate, spam, English, surzhyk and prompt injection),
full table in [docs/eval-results.md](docs/eval-results.md), rerun with `npm run eval`:

| Metric | Result |
|---|---|
| Processed by AI | 18/18 |
| Client type / priority in expected range | 18/18 / 18/18 |
| Services detected / budget extracted (±15%, UAH and EUR converted) | 15/15 / 12/12 |
| Duplicate flagged / prompt injection ignored | 1/1 / 1/1 |
| Lead creation incl. AI, avg / p95 | 7.2 s / 8.9 s |

Measured on synthetic data only; time savings for the real business are an estimate, not a measurement.

Presentation for Gravity (10 slides, Ukrainian): https://claude.ai/artifact/Jk3Wfpe1ruCBocPP4TTYxf · print cheat sheets (A4): [demo](docs/gravity-cheatsheet.pdf), [Q&A](docs/gravity-qa-cheatsheet.pdf)

Metrics dashboard (measured Odoo counts + eval, estimates labelled separately): https://claude.ai/artifact/5xgb9wdaRM36gqQLHX2gT9 — data from `npm run metrics:export` (`tmp/metrics.json`). Estimate «before/after» assumes 15 min of manual work per lead today.

## Stack

- Odoo 20 Enterprise (Online trial): Website, CRM, Sales, Project, Purchase, Helpdesk, Recruitment,
  Knowledge, AI (native agents, AI server actions), Automation Rules
- TypeScript / Node.js scripts (tsx), GitHub Actions CI (typecheck)

## Documentation

| # | Area | File |
|---|---|---|
| — | **Огляд флоу українською: 10 етапів + допоміжні процеси** | [docs/flow-overview-uk.md](docs/flow-overview-uk.md) |
| 00 | Coverage of the 10-stage process map | [docs/00-process-map-coverage.md](docs/00-process-map-coverage.md) |
| 01 | Odoo setup, configuration as code | [docs/01-odoo-setup.md](docs/01-odoo-setup.md) |
| 02 | Sales: AI analysis of website leads | [docs/02-lead-ai-analysis.md](docs/02-lead-ai-analysis.md) |
| 03 | Quotation → project → tasks → escalation | [docs/03-sales-to-project.md](docs/03-sales-to-project.md) |
| 04 | Service: ticket AI triage + SLA | [docs/04-helpdesk-ai-triage.md](docs/04-helpdesk-ai-triage.md) |
| 05 | HR: AI applicant profile | [docs/05-hr-applicant-ai.md](docs/05-hr-applicant-ai.md) |
| 06 | Meetings: transcript → summary → draft tasks | [docs/06-meeting-transcript-ai.md](docs/06-meeting-transcript-ai.md) |
| 07 | Internal AI assistant on Knowledge | [docs/07-internal-ai-assistant.md](docs/07-internal-ai-assistant.md) |
| 08 | Procurement: specification → draft RFQs | [docs/08-purchase-from-spec.md](docs/08-purchase-from-spec.md) |
| 09 | Partners: contact reminders | [docs/09-partner-contact-reminders.md](docs/09-partner-contact-reminders.md) |
| 10 | Production: AI site status report | [docs/10-site-status-report.md](docs/10-site-status-report.md) |
| 11 | Finance: spreadsheet → management report | [docs/11-finance-management-report.md](docs/11-finance-management-report.md) |
| 12 | Marketing: campaign efficiency report | [docs/12-marketing-campaign-report.md](docs/12-marketing-campaign-report.md) |
| 13 | Contract and prepayment (stage 3) | [docs/13-contract-and-prepayment.md](docs/13-contract-and-prepayment.md) |
| 14 | Design: AI draft specification (stage 4) | [docs/14-ai-draft-specification.md](docs/14-ai-draft-specification.md) |
| 15 | Crew planning and field visits (stages 5, 7) | [docs/15-crew-planning.md](docs/15-crew-planning.md) |
| 16 | Commissioning checklist and handover (stages 8, 9) | [docs/16-commissioning-and-handover.md](docs/16-commissioning-and-handover.md) |
| — | **Telegram bot: user guide (stages, handoffs, commands)** | [BOT.md](BOT.md) |
| — | **Сценарії бота українською: що приходить, кому, як відтворити** | [docs/bot-scenarios-uk.md](docs/bot-scenarios-uk.md) |
| 17 | Telegram bot: notifications and quick actions | [docs/17-telegram-bot.md](docs/17-telegram-bot.md) |
| — | Evaluation on 18 synthetic leads | [docs/eval-results.md](docs/eval-results.md) |
| — | Architecture decisions | [docs/decisions](docs/decisions) |

## Run

    npm ci
    cp .env.example .env   # ODOO_URL, ODOO_API_KEY (Odoo → Preferences → Account Security → API key)
    npm run check
    npm run seed:crm && npm run seed:views && npm run seed:ai && npm run seed:website && npm run seed:form && npm run seed:thank-you
    npm run seed:sales && npm run seed:project && npm run seed:helpdesk && npm run seed:homepage
    npm run seed:hr && npm run seed:meetings && npm run seed:knowledge && npm run seed:purchase
    npm run seed:partners && npm run seed:site-report && npm run seed:finance && npm run import:expenses && npm run seed:marketing
    npm run seed:contract && npm run seed:spec && npm run seed:planning && npm run seed:handover && npm run seed:appointment

End-to-end checks (they create synthetic records in the live Odoo, so they are manual, not in CI):
`eval`, `e2e:project`, `e2e:tickets`, `e2e:applicants`, `e2e:meetings`, `e2e:purchase`,
`e2e:partners`, `e2e:site-report`, `e2e:finance`, `e2e:marketing`,
`e2e:contract`, `e2e:spec`, `e2e:planning`, `e2e:handover`.
All of them in one go: `npm run regression` (sequential, ~10–15 min) → `tmp/regression-summary.md` (step, script, ✅/❌, time) and the full log `tmp/regression.txt`.
Last run 2026-11-05: **14/14 passed** (eval 18 leads + 13 e2e scenarios, ~5 min).

Some modules must be installed first: `npm run install:modules -- <names>` (see each doc). Stages 5/7 need `planning_field_service`.

## Demo video
[Watch online](https://claude.ai/artifact/9mntsBuQdJ38R4xooKN81z) · file [docs/gravity-demo.mp4](docs/gravity-demo.mp4) — 3:20, Ukrainian captions, full flow from website lead to project handover, AI assistant and manager stats (screenshots from the manual run on 2026-11-06, synthetic data).
