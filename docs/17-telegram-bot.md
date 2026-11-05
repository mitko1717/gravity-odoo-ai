# 17. Telegram bot: notifications and quick actions

## Problem
Managers, PMs, engineers and buyers do not live in Odoo all day. Events that need a human decision (new lead, spec ready, RFQ drafted, tests passed, overdue task) wait until someone opens the right screen.

## Solution
A small Node.js bot (grammY, `src/bot/`) that polls Odoo over JSON-2 and pushes role-based notifications with action buttons. Every button calls Odoo and leaves a chatter note «… через Telegram (@user)», so the audit trail stays in Odoo.

| Event (polled) | Role | Buttons |
|---|---|---|
| New lead with AI summary | sales | Взяти в роботу, Чернетка відповіді, Створити пропозицію, Підтвердити замовлення |
| AI spec draft ready | engineer | Погодити специфікацію (→ RFQs) |
| Draft RFQ | procurement | Підтвердити закупівлю |
| Overdue task | pm | +3 дні, Готово |
| Prepayment received / tests passed | pm | Відкрити в Odoo |
| Handover blocked (open checks) | pm | Відкрити в Odoo |
| Critical helpdesk ticket | service | Беру |
| New applicant | hr | Відкрити в Odoo |

Commands: `/help`, `/leads`, `/lead_ID`, `/stats`, `/digest` (also daily at `BOT_DIGEST_HOUR`), `/overdue`, `/whoami`, `/request`, `/users` (admin).

`/stats` and the digest are computed by rules (counts and sums from Odoo), not by AI.

## Guardrails
- Whitelist: only chat IDs in `TELEGRAM_ALLOWED_CHAT_IDS` or approved via `/request` → admin approve. Others get only `/whoami` and `/request`.
- Admin (`TELEGRAM_ADMIN_CHAT_ID`) manages roles, closes/reopens and deletes access in `/users`.
- Nothing is sent to clients or vendors: buttons change Odoo records only (lead stage, quotation, confirmations, task dates).
- Token and API key live in `.env` only (gitignored); never in code or logs. The token was rotated after a leak into a chat paste.
- Polling (no webhooks): no public URL or open port needed.

## Setup and run
`.env`: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_CHAT_IDS`, `TELEGRAM_ADMIN_CHAT_ID`, `BOT_POLL_SECONDS` (default 30), `BOT_DIGEST_HOUR` (default 9), plus `ODOO_URL`, `ODOO_API_KEY`.

    npm run bot

Cursors and users are stored in `tmp/bot-state.json`. On the first start cursors are set to the current max IDs, so old records do not flood the chat.

Deployment: runs locally for the demo. Planned: deploy to Railway for the review period, then delete the service after the assignment.

## Verified
UI walkthrough on S00014 (2026-11-05): lead push → quotation from the bot → confirm → «Передоплату отримано» → spec approved from the bot → RFQs confirmed from the bot → «Тести пройдено» after the commissioning gate.

## Limits
- Any allowed user can press any action button; per-role permission checks are backlog.
- The state file is ephemeral on Railway without a volume.
- Polling adds up to `BOT_POLL_SECONDS` of delay.
