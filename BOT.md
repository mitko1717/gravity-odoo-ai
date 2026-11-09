# Telegram bot — user guide

Bot: https://t.me/gravity_test_promo_bot · technical details: [docs/17-telegram-bot.md](docs/17-telegram-bot.md) · code: `src/bot/`

The bot is the channel between departments: Odoo holds the data, the bot tells each person when it is their turn and gives buttons for the next step. Every button writes to Odoo and leaves a note «… через Telegram (@user)»; every reply carries an «Відкрити в Odoo» link. Nothing is sent to clients or vendors.

## Stages covered (Gravity process map)

| # | Stage | What arrives in Telegram | Role | Buttons |
|---|---|---|---|---|
| 1 | Marketing → Sales | New website lead with AI summary (type, services, budget, priority, missing data) | Sales | Взяти в роботу, Чернетка відповіді, 📅 Консультація (booking-link draft + activity), Створити пропозицію |
| 2 | Sales | «📅 Клієнт записався на консультацію» (booking on the public Appointments page) | Sales | Відкрити в Odoo |
| 2–3 | Sales → Finance → PM | Quotation draft; order confirmed → project with 9 stages + 30% prepayment invoice; payment → «Передоплату отримано» | Sales, PM | Підтвердити замовлення |
| 4 | Design | AI draft specification from the catalog | Engineer | Погодити специфікацію (→ draft RFQs) |
| 5–6 | Procurement | Draft RFQs per vendor | Procurement | Підтвердити закупівлю |
| 7 | Installation | Overdue task | PM | +3 дні, Готово |
| 8 | Commissioning | AI checklist; «Здача заблокована» while checks are open | Engineer, PM | 🧪 Чекліст (close checks from the phone) |
| 9 | Handover | «Тести пройдено» → handover email draft + Sign act (sent by a person) | PM | Відкрити в Odoo |
| 10 | Service | Critical ticket after AI triage + SLA | Service | Беру |
| 10 | Service | «🚨 SLA прострочено»: the ticket missed its SLA deadline (escalation) | PM | Беру |
| — | HR | New applicant with AI profile (no automatic rejection) | HR | Відкрити в Odoo |

All scenarios in Ukrainian (what comes, to whom, how to reproduce): [docs/bot-scenarios-uk.md](docs/bot-scenarios-uk.md).

## Handoff between departments

- `/projects` — all objects: progress (5/9), current stage and who owns it, overdue mark.
- `/project_ID` — the 9 stages with status, deadline, owner, «waiting for previous stage»; buttons for the current stage: В роботу / На перевірку / Готово, 🧪 Чекліст.
- A stage set to «Готово» (in the bot or in Odoo) → the owner of the next stage gets «👉 Ваша черга» with «Взяти в роботу» (only when the previous stage in order was finished; stages closed out of order notify the PM only). The PM sees every change.

| Stage | Owner role |
|---|---|
| Уточнення технічних вимог, Погодження специфікації з клієнтом | Sales |
| Виїзд на об’єкт, Проєктування, Налаштування та програмування, Тестування системи | Engineer |
| Закупівля обладнання | Procurement |
| Монтаж, Здача клієнту та навчання | PM |

## Commands

`/help` · `/flow` (this guide in Ukrainian, inside the bot) · `/demo` (video, slides, repo; works without access) · `/leads`, `/lead_ID` · `/projects`, `/project_ID` · `/stats` · `/digest` (also every morning) · `/overdue` · `/whoami` · `/request` · `/users` (admin)

## Access and roles

New user: Start → `/request` → the admin approves and picks roles (Sales, PM, Engineer, Procurement, Service, HR) in `/users`. Users get only their roles' notifications; the admin gets everything. Access can be closed, reopened or deleted.

Buttons are checked by role too: lead and order buttons — Sales; spec approval and checks — Engineer; RFQ — Procurement; overdue tasks — PM; tickets — Service; a stage button — the owner role of that stage. PM and admin may press everything; viewing cards needs no role. A refused press gets «Ця дія для ролі …» and changes nothing.

## Run

    npm run bot     # needs TELEGRAM_BOT_TOKEN, TELEGRAM_ADMIN_CHAT_ID, ODOO_URL, ODOO_API_KEY in .env

Runs locally (polling every 30 s, no public URL). For the review period it will run on Railway and be deleted afterwards.

## Limits

State is a local JSON file; up to 30 s delay.

## Deploy to Railway

- Start command: `npm start` (`tsx src/bot/index.ts`, no `.env` file; variables come from Railway).
- Variables: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, `TELEGRAM_ALLOWED_CHAT_IDS`, `ODOO_URL`, `ODOO_API_KEY`, `ODOO_BOT_USER_ID`, `BOT_POLL_SECONDS`, `BOT_DIGEST_HOUR` (same values as local `.env`), plus `BOT_STATE_STORE=odoo`.
- With `BOT_STATE_STORE=odoo` the state lives in Odoo system parameter `gravity_bot.state` (Settings → Technical → System Parameters, `?debug=1`), so restarts keep approved users and cursors. On the first run it is migrated from `tmp/bot-state.json` if that file exists.
- Run only one bot instance at a time (stop the local `npm run bot` before deploying), otherwise Telegram returns 409 Conflict.
