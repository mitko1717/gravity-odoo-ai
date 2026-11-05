# 01 — Odoo environment and configuration as code

## Environment

- Odoo 20.0+e (Enterprise), Odoo Online trial (`test6017.odoo.com`), 15-day trial.
- Installed for the prototype: CRM, Sales, Project, Website (Contact Form), Appointments,
  Knowledge, Sign, Planning, Invoicing, Employees, AI (with `ai_fields`, `ai_server_actions`),
  Automation Rules (`base_automation`), Studio (`web_studio`).
- Studio and API access are part of the trial; on a paid plan Studio requires the Custom plan.

## Approach: configuration as code

All configuration is created through the Odoo JSON-2 API (`POST /json/2/<model>/<method>`,
bearer API key), not by clicking. Every script is idempotent and safe to re-run.

| Script | What it does |
|---|---|
| `npm run check` | Verifies the API key, installed modules and CRM stages |
| `npm run seed:crm` | Ukrainian pipeline stages, tags, custom lead fields (form + AI) |
| `npm run seed:views` | "Gravity / AI" tab on the lead form (inherited view) |
| `npm run seed:ai` | AI tools, AI action and the automation rule (see 02) |
| `npm run seed:website` | Allows custom lead fields to be filled by website forms |

## Setup

```bash
npm install
cp .env.example .env   # set ODOO_URL and ODOO_API_KEY (Odoo → My Preferences → Account Security)
npm run check
npm run seed:crm && npm run seed:views && npm run seed:ai && npm run seed:website
```

## Pipeline stages

Нова заявка → Кваліфікована → Консультація / виїзд → Комерційна пропозиція → Договір підписано.
