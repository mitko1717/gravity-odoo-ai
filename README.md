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

## Stack

- Odoo 20 Enterprise (Online trial): Website, CRM, Sales, Project, Purchase, Helpdesk, Recruitment,
  Knowledge, AI (native agents, AI server actions), Automation Rules
- TypeScript / Node.js scripts (tsx), GitHub Actions CI (typecheck)

## Documentation

| # | Area | File | AI |
|---|---|---|---|
| 01 | Odoo setup, configuration as code | [docs/01-odoo-setup.md](docs/01-odoo-setup.md) | — |
| 02 | Sales: AI analysis of website leads | [docs/02-lead-ai-analysis.md](docs/02-lead-ai-analysis.md) | yes |
| 03 | Quotation → project → tasks → escalation | [docs/03-sales-to-project.md](docs/03-sales-to-project.md) | rules |
| 04 | Service: ticket AI triage + SLA | [docs/04-helpdesk-ai-triage.md](docs/04-helpdesk-ai-triage.md) | yes |
| 05 | HR: AI applicant profile | [docs/05-hr-applicant-ai.md](docs/05-hr-applicant-ai.md) | yes |
| 06 | Meetings: transcript → summary → draft tasks | [docs/06-meeting-transcript-ai.md](docs/06-meeting-transcript-ai.md) | yes |
| 07 | Internal AI assistant on Knowledge | [docs/07-internal-ai-assistant.md](docs/07-internal-ai-assistant.md) | yes |
| 08 | Procurement: specification → draft RFQs | [docs/08-purchase-from-spec.md](docs/08-purchase-from-spec.md) | rules |
| 09 | Partners: contact reminders | [docs/09-partner-contact-reminders.md](docs/09-partner-contact-reminders.md) | rules |
| 10 | Production: AI site status report | [docs/10-site-status-report.md](docs/10-site-status-report.md) | yes |
| 11 | Finance: spreadsheet → management report | [docs/11-finance-management-report.md](docs/11-finance-management-report.md) | yes |
| — | Evaluation on 18 synthetic leads | [docs/eval-results.md](docs/eval-results.md) | — |
| — | Architecture decisions | [docs/decisions](docs/decisions) | — |

## Run

    npm ci
    cp .env.example .env   # ODOO_URL, ODOO_API_KEY (Odoo → Preferences → Account Security → API key)
    npm run check
    npm run seed:crm && npm run seed:views && npm run seed:ai && npm run seed:website && npm run seed:form
    npm run seed:sales && npm run seed:project && npm run seed:helpdesk && npm run seed:homepage
    npm run seed:hr && npm run seed:meetings && npm run seed:knowledge && npm run seed:purchase
    npm run seed:partners && npm run seed:site-report && npm run seed:finance && npm run import:expenses

End-to-end checks (they create synthetic records in the live Odoo, so they are manual, not in CI):
`eval`, `e2e:project`, `e2e:tickets`, `e2e:applicants`, `e2e:meetings`, `e2e:purchase`,
`e2e:partners`, `e2e:site-report`, `e2e:finance`.

Some modules must be installed first: `npm run install:modules -- <names>` (see each doc).
