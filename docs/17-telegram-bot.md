# 17. Telegram bot: notifications, stage handoffs and quick actions

User guide (stages, roles, commands): [BOT.md](../BOT.md) · in the bot: `/flow` · code: `src/bot/`

## Problem
Managers, PMs, engineers and buyers do not live in Odoo all day. Events that need a human decision (new lead, spec ready, RFQ drafted, tests passed, overdue task) wait until someone opens the right screen, and the next department learns about a finished stage late, by phone or chat.

## Solution
A small Node.js bot (grammY) that polls Odoo over JSON-2 and pushes role-based notifications with action buttons. Odoo stays the single source of truth: every button is an ordinary Odoo write that leaves a chatter note «… через Telegram (@user)», and every reply carries an «Відкрити в Odoo» / «Етап в Odoo» link to the changed record.

### Notifications (polled every `BOT_POLL_SECONDS`)

| Event | Process map stage | Role | Buttons |
|---|---|---|---|
| New website lead with AI summary | 1 → 2 | sales | Взяти в роботу, Чернетка відповіді, Створити пропозицію |
| Quotation draft (after «Створити пропозицію») | 2 | sales | Підтвердити замовлення (→ project + 30% prepayment invoice) |
| Prepayment received | 3 | pm | Відкрити в Odoo |
| AI specification draft ready | 4 | engineer | Погодити специфікацію (→ draft RFQs) |
| Draft RFQ per vendor | 5–6 | procurement | Підтвердити закупівлю |
| Overdue project task | 5–7 | pm | +3 дні, Готово |
| Handover blocked (open checks) / tests passed | 8–9 | pm | Відкрити в Odoo |
| Critical helpdesk ticket after AI triage | 10 | service | Беру |
| New applicant with AI profile | HR | hr | Відкрити в Odoo |
| Project stage changed (bot or Odoo UI) | 1–9 | pm | Картка проєкту, Відкрити в Odoo |
| Previous stage done → «👉 Ваша черга» | 1–9 | owner of the next stage | Взяти в роботу, Картка проєкту, Етап в Odoo |

### Project pipeline and handoffs (`src/bot/pipeline.ts`)
The 9 tasks of the project template are the stages of one object. Each stage has an owner role:

| Stage (project task) | Owner role |
|---|---|
| Уточнення технічних вимог · Погодження специфікації з клієнтом | sales |
| Виїзд на об’єкт · Проєктування · Налаштування та програмування · Тестування системи | engineer |
| Закупівля обладнання | procurement |
| Монтаж · Здача клієнту та навчання | pm |

- `/projects` — objects with progress (done/9), the current stage and its owner, overdue mark.
- `/project_ID` — every stage with status icon (⏳ До виконання, 🔵 В роботі, 🟣 На перевірці, ✅ Готово), deadline, owner, overdue, «чекає попередній етап», open checks; buttons for the current stage only: В роботу / На перевірку / Готово, 🧪 Чекліст, Оновити.
- A stage blocked by an unfinished dependency («Waiting» in Odoo) cannot be moved from the bot.
- 🧪 Чекліст: open commissioning checks (sub-tasks) as buttons; the engineer closes them on site. Moving «Тестування системи» to «Готово» still runs the Odoo gate automation (doc 16).
- Transition detection: each tick reads pipeline tasks with `write_date >=` the last seen value and compares the stage with the last known one (`taskStages` in the state file). So changes made in the Odoo UI notify too. The first run only memorises stages (no flood); new tasks in «До виконання» are not announced.
- Rules only: no AI in statuses, handoffs or counts.

### Commands

| Command | What it does |
|---|---|
| `/help` | Commands and notification types |
| `/flow` | How the bot works: stages, departments, who hands work to whom (Ukrainian) |
| `/leads`, `/lead_ID` | Leads without a quotation (🆕 new / 🟢 in work, AI priority); lead card with buttons |
| `/projects`, `/project_ID` | Pipeline overview; project card with stage buttons |
| `/stats` | Reports: leads, campaigns, overdue, service, pipeline (rules, not AI) |
| `/digest` | Daily summary now (also sent automatically at `BOT_DIGEST_HOUR`) |
| `/overdue` | Overdue project tasks |
| `/whoami`, `/request` | Chat ID; ask the admin for access |
| `/users` | Admin: roles, close/reopen access, delete |

## Guardrails
- Whitelist: only chat IDs in `TELEGRAM_ALLOWED_CHAT_IDS` or approved via `/request` → admin approve. Others get only `/start`, `/whoami` and `/request`.
- Roles route notifications; the admin (`TELEGRAM_ADMIN_CHAT_ID`) receives everything and manages users in `/users`.
- Nothing is sent to clients or vendors: buttons change Odoo records only (lead stage, quotation, confirmations, task stages and dates, checks).
- Odoo automations stay in charge: the bot writes the same fields a user would, so spec → RFQs and the tests gate run server-side.
- Token and API key live in `.env` only (gitignored); never in code or logs. The token was rotated after a leak into a chat paste.
- Polling, no webhooks: no public URL or open port. Calls are sequential (Odoo Online rate limit, HTTP 429).
- A user who blocked the bot does not stop notifications for others; `bot.catch` logs failed updates.

## Architecture

| File | Responsibility |
|---|---|
| `index.ts` | Commands, callback routing, poll loop, broadcast by role |
| `events.ts` | Polled events (leads, activities, messages, tickets, RFQs, applicants) with cursors |
| `pipeline.ts` | Project stages: list, card, stage moves, checklist, transition detection |
| `actions.ts` | Lead / order / spec / RFQ / task / ticket buttons |
| `access.ts`, `roles.ts` | Whitelist, `/request`, `/users`, roles |
| `stats.ts` | `/stats` and the digest |
| `guide.ts` | `/flow` text |
| `state.ts` | `tmp/bot-state.json`: cursors, last known stages, users |
| `config.ts`, `env-file.ts`, `format.ts` | Env, `.env` sync of allowed IDs, HTML helpers |

## Setup and run
`.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_CHAT_IDS`, `TELEGRAM_ADMIN_CHAT_ID`, `BOT_POLL_SECONDS` (default 30), `BOT_DIGEST_HOUR` (default 9), plus `ODOO_URL`, `ODOO_API_KEY`.

    npm run bot

Deployment: runs locally for the demo. Planned: deploy to Railway for the review period, then delete the service after the assignment.

## How to test
1. `/projects` → `/project_ID` → «▶ В роботу» on the current stage → «✅ Готово».
2. Expected: the card refreshes with a link to the stage; the owner of the next stage gets «👉 Ваша черга»; the PM gets the stage change; the task chatter shows «… через Telegram».
3. Change a stage in the Odoo UI → the same notifications within one poll interval.
4. On «Тестування системи»: 🧪 Чекліст → close checks → «Готово» → «Тести пройдено» (or «Здача заблокована» while checks are open).

## Verified
UI walkthrough on S00014 (2026-11-05): lead push → quotation from the bot → confirm → «Передоплату отримано» → spec approved from the bot → RFQs confirmed from the bot → commissioning checks → «Тести пройдено» after the gate.
Pipeline commands (`/projects`, handoffs, checklist, `/flow`): pending a live test.

## Limits
- Any allowed user can press any action button; per-role permission checks are backlog.
- The state file is ephemeral on Railway without a volume (cursors and known stages reset → first run memorises again).
- Polling adds up to `BOT_POLL_SECONDS` of delay.
- Stage owners are fixed per task name; real Gravity roles and people need configuration.
