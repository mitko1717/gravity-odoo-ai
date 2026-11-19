<div align="center">

# Opsline

**Odoo + AI for installation and service businesses: from a website request to a delivered project, without the manual routine.**

[▶ Showcase page with video](https://claude.ai/artifact/AgJkUuwEGH2P4cdSLwK5Nt) · [🎬 Demo video (2:42)](docs/opsline-demo.mp4) · [🤖 Telegram bot](https://t.me/gravity_test_promo_bot) · [🇺🇦 Українською](README.uk.md)

</div>

![AI lead analysis in Odoo](docs/media/05-lead-ai.png)

## What it does

A customer leaves a request on the website. Seconds later the lead is in Odoo CRM with an AI summary, budget, priority,
missing data, next step and a reply draft, and the manager gets it in Telegram with action buttons. One click turns it
into a quotation, an order, a project with 9 delivery stages, a prepayment invoice and a contract to sign. Engineers get
an AI draft specification, purchasing gets draft RFQs, commissioning gets an AI test protocol, and service tickets are
triaged with SLA. People approve; nothing is sent to customers or vendors automatically.

The demo runs on a fictional company, **Northwind Home Systems** (smart home, electrics, climate). All data is synthetic.

| | |
|---|---|
| ![Request form](docs/media/02-request-form.png) | ![Order to project](docs/media/08-order-to-project.png) |
| ![AI specification](docs/media/10-ai-specification.png) | ![Ticket triage](docs/media/13-ticket-triage.png) |

## Why it is different

- **Native Odoo first.** Website, CRM, Sales, Project, Purchase, Helpdesk, Sign, Knowledge, Planning, Recruitment and Odoo 20 AI agents. Custom code only where Odoo cannot do it.
- **AI where it saves real work, rules everywhere else.** AI reads and drafts; numbers, statuses and percentages are computed by rules.
- **Safe by design.** The model never writes records directly: it calls a tool with a strict JSON schema, Python validates and writes. Customer text is untrusted input; prompt injection is covered by tests.
- **Humans decide.** Recommendations, drafts and activities, never automatic rejection or sending.
- **Configuration as code.** Idempotent seed scripts re-create the whole setup on a fresh Odoo with one command each.
- **Measurable.** An evaluation set and a regression suite ship with the code.

## Measured results

AI lead analysis on 18 synthetic leads (vague, duplicate, spam, Ukrainian/Russian input, prompt injection).
Full table: [docs/eval-results.md](docs/eval-results.md), rerun with `npm run eval`.

| Metric | Result |
|---|---|
| Processed by AI | 18/18 |
| Client type correct | 18/18 |
| Services detected | 15/15 |
| Priority within expected range | 17/18 |
| Budget extracted (±15%, UAH and EUR converted) | 12/12 |
| Duplicate flagged / prompt injection ignored | 1/1 / 1/1 |
| Lead creation incl. AI, avg / p95 | 5.0 s / 5.9 s |
| End-to-end regression (eval + 13 scenarios) | 14/14 |

Measured on synthetic data only; time savings for a real business are estimated separately during a pilot.

## Coverage: the whole order lifecycle

| # | Stage | What is automated | Doc |
|---|---|---|---|
| 1 | Marketing and partners | Website form → lead; campaign efficiency report; partner contact reminders | [02](docs/02-lead-ai-analysis.md), [09](docs/09-partner-contact-reminders.md), [12](docs/12-marketing-campaign-report.md) |
| 2 | Sales | AI lead analysis; consultation booking; quotation templates | [02](docs/02-lead-ai-analysis.md), [03](docs/03-sales-to-project.md) |
| 3 | Sales and finance | Order → 30% prepayment invoice + contract in Sign; payment → PM | [13](docs/13-contract-and-prepayment.md) |
| 4 | Design | AI draft specification from the catalog, engineer approves | [14](docs/14-ai-draft-specification.md) |
| 5 | Project management | Project template with 9 stages, deadlines, dependencies, overdue escalation | [03](docs/03-sales-to-project.md) |
| 6 | Purchasing | Approved specification → draft RFQs per vendor | [08](docs/08-purchase-from-spec.md) |
| 7 | Installation | Crew shifts per field task; AI site status report | [15](docs/15-crew-planning.md), [10](docs/10-site-status-report.md) |
| 8 | Commissioning | AI test protocol as sub-tasks | [16](docs/16-commissioning-and-handover.md) |
| 9 | Handover | Gate: all checks closed; acceptance act in Sign; AI handover email draft | [16](docs/16-commissioning-and-handover.md) |
| 10 | Service | AI ticket triage + SLA, breach escalation | [04](docs/04-helpdesk-ai-triage.md) |
| — | HR | AI applicant profile, no automatic rejection | [05](docs/05-hr-applicant-ai.md) |
| — | Meetings | Transcript → summary → draft tasks | [06](docs/06-meeting-transcript-ai.md) |
| — | Knowledge | Internal AI assistant that answers from company articles with sources | [07](docs/07-internal-ai-assistant.md) |
| — | Finance | Spreadsheet → management report | [11](docs/11-finance-management-report.md) |
| — | Owner | Weekly owner report | [18](docs/18-weekly-owner-report.md) |
| — | Telegram | Role-based notifications and one-tap actions | [BOT.md](BOT.md), [17](docs/17-telegram-bot.md) |

Process map coverage: [docs/00-process-map-coverage.md](docs/00-process-map-coverage.md) · setup: [docs/01-odoo-setup.md](docs/01-odoo-setup.md) · architecture decisions: [docs/decisions](docs/decisions)

## Architecture

```
Website form ─▶ Odoo CRM ─▶ Automation rule ─▶ Odoo AI agent ─▶ tool (strict JSON schema) ─▶ Python validation ─▶ Odoo records
                   │                                                                                                  │
                   └──────────────▶ Telegram bot (Node.js, grammY, polls Odoo JSON-2 API) ◀─────────────── role-based pushes
```

- Odoo 20 Enterprise: Website, CRM, Sales, Invoicing, Sign, Project, Planning, Purchase, Helpdesk, Recruitment, Knowledge, AI, Automation Rules.
- TypeScript / Node.js 20: seed scripts (configuration as code), e2e scenarios, eval, Telegram bot.
- Hosting: Odoo Online or Odoo.sh; the bot runs on Railway. Secrets live in `.env` and Railway variables only.

## Run it

```bash
npm ci
cp .env.example .env   # ODOO_URL, ODOO_API_KEY (Odoo → Preferences → Account Security → API key)
npm run check
npm run seed:crm && npm run seed:views && npm run seed:ai && npm run seed:website && npm run seed:form && npm run seed:thank-you
npm run seed:sales && npm run seed:project && npm run seed:helpdesk && npm run seed:homepage
npm run seed:hr && npm run seed:meetings && npm run seed:knowledge && npm run seed:purchase
npm run seed:partners && npm run seed:site-report && npm run seed:finance && npm run import:expenses && npm run seed:marketing
npm run seed:contract && npm run seed:spec && npm run seed:planning && npm run seed:handover && npm run seed:appointment && npm run seed:weekly
```

Some modules must be installed first: `npm run install:modules -- <names>` (see each doc).

Checks (they create synthetic records in the live Odoo, so they are run manually, not in CI):

```bash
npm run eval          # AI quality on 18 synthetic leads
npm run regression    # eval + 13 e2e scenarios → tmp/regression-summary.md
npm run bot           # Telegram bot locally (only one instance at a time)
```

Maintenance: `npm run archive:leads` archives unfinished demo leads and their reminders (dry run first, then `-- --apply`).

## Work with us

1. **Audit** — map your process, find the 3 most expensive manual steps, estimate the effect.
2. **Pilot** — one end-to-end flow live on your Odoo, with before/after metrics.
3. **Rollout** — remaining stages, roles, team training, Telegram channel.
4. **Support** — monitoring, prompt and rule tuning, new automations every month.

A live walkthrough on a fresh Odoo stand takes 30 minutes. Contact via [GitHub](https://github.com/mitko1717) or the [Telegram bot](https://t.me/gravity_test_promo_bot).

---

<sub>Northwind Home Systems is a fictional company; all customers, partners, candidates and amounts are synthetic. Prices in the demo catalog are placeholders marked [demo price].</sub>
