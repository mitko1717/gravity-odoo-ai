# Gravity × Odoo × AI — Lead-to-Project automation

Unofficial demo prototype built as a test assignment for the AI Builder role at Gravity
(smart home, electrical and engineering systems, Ukraine). Not affiliated with or endorsed
by Gravity; all customer data is synthetic.

## What it shows

Website form → CRM lead → AI analysis (Odoo 20 native AI) → manager activity →
quotation → sales order → project with standard tasks → overdue reminders.

## Stack

- Odoo 20 Enterprise (Online trial): Website, CRM, Sales, Project, AI, Automation Rules
- TypeScript / Node.js scripts via the Odoo JSON-2 API: configuration seed, synthetic leads, metrics

## Documentation

| Topic | File |
|---|---|
| Architecture decisions | [docs/decisions](docs/decisions) |
| Odoo setup, configuration as code | [docs/01-odoo-setup.md](docs/01-odoo-setup.md) |
| AI analysis of leads | [docs/02-lead-ai-analysis.md](docs/02-lead-ai-analysis.md) |
| Quotation → project → tasks → escalation | [docs/03-sales-to-project.md](docs/03-sales-to-project.md) |
| Service tickets: AI triage + SLA | [docs/04-helpdesk-ai-triage.md](docs/04-helpdesk-ai-triage.md) |
| Evaluation on 18 synthetic leads | [docs/eval-results.md](docs/eval-results.md) |

More sections are added as each stage is implemented and verified.
