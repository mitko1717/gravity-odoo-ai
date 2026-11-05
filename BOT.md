# Telegram bot — user guide

Bot: https://t.me/gravity_test_promo_bot · technical details: [docs/17-telegram-bot.md](docs/17-telegram-bot.md) · code: `src/bot/`

The bot is the channel between departments: Odoo holds the data, the bot tells each person when it is their turn and gives buttons for the next step. Every button writes to Odoo and leaves a note «… через Telegram (@user)»; every reply carries an «Відкрити в Odoo» link. Nothing is sent to clients or vendors.

## Stages covered (Gravity process map)

| # | Stage | What arrives in Telegram | Role | Buttons |
|---|---|---|---|---|
| 1 | Marketing → Sales | New website lead with AI summary (type, services, budget, priority, missing data) | Sales | Взяти в роботу, Чернетка відповіді, Створити пропозицію |
| 2–3 | Sales → Finance → PM | Quotation draft; order confirmed → project with 9 stages + 30% prepayment invoice; payment → «Передоплату отримано» | Sales, PM | Підтвердити замовлення |
| 4 | Design | AI draft specification from the catalog | Engineer | Погодити специфікацію (→ draft RFQs) |
| 5–6 | Procurement | Draft RFQs per vendor | Procurement | Підтвердити закупівлю |
| 7 | Installation | Overdue task | PM | +3 дні, Готово |
| 8 | Commissioning | AI checklist; «Здача заблокована» while checks are open | Engineer, PM | 🧪 Чекліст (close checks from the phone) |
| 9 | Handover | «Тести пройдено» → handover email draft + Sign act (sent by a person) | PM | Відкрити в Odoo |
| 10 | Service | Critical ticket after AI triage + SLA | Service | Беру |
| — | HR | New applicant with AI profile (no automatic rejection) | HR | Відкрити в Odoo |

## Handoff between departments

- `/projects` — all objects: progress (5/9), current stage and who owns it, overdue mark.
- `/project_ID` — the 9 stages with status, deadline, owner, «waiting for previous stage»; buttons for the current stage: В роботу / На перевірку / Готово, 🧪 Чекліст.
- A stage set to «Готово» (in the bot or in Odoo) → the owner of the next stage gets «👉 Ваша черга» with «Взяти в роботу». The PM sees every change.

| Stage | Owner role |
|---|---|
| Уточнення технічних вимог, Погодження специфікації з клієнтом | Sales |
| Виїзд на об’єкт, Проєктування, Налаштування та програмування, Тестування системи | Engineer |
| Закупівля обладнання | Procurement |
| Монтаж, Здача клієнту та навчання | PM |

## Commands

`/help` · `/flow` (this guide in Ukrainian, inside the bot) · `/leads`, `/lead_ID` · `/projects`, `/project_ID` · `/stats` · `/digest` (also every morning) · `/overdue` · `/whoami` · `/request` · `/users` (admin)

## Access and roles

New user: Start → `/request` → the admin approves and picks roles (Sales, PM, Engineer, Procurement, Service, HR) in `/users`. Users get only their roles' notifications; the admin gets everything. Access can be closed, reopened or deleted.

## Run

    npm run bot     # needs TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID, ODOO_URL, ODOO_API_KEY in .env

Runs locally (polling every 30 s, no public URL). For the review period it will run on Railway and be deleted afterwards.

## Limits

Any allowed user can press any button (role checks on buttons are backlog); state is a local JSON file; up to 30 s delay.
