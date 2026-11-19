# 18 — Weekly owner report (scheduled AI)

## Problem
The owner sees the business through separate screens (CRM, Sales, Project, Helpdesk) and asks managers for a weekly summary by hand.

## Solution
- Knowledge article «Weekly owner report (demo)»: every run of the AI action «AI: weekly owner report» (`odoo/weekly-report/`) adds a child article «Weekly report — YYYY-MM-DD» (an archive of weeks). Writing into the parent body was overwritten by the collaborative editor when the article was open in a browser.
- Read tool computes the figures by rules: leads this/previous week, high priority, needs review, without manager; confirmed orders and amount; overdue project tasks with examples; open and critical tickets, SLA reached/failed this week.
- AI writes only 3 sentences and 1–3 attention items; the figures in the article are rendered by code, not by the model.
- Scheduled action «Opsline: weekly owner report» (`ir.cron`, weekly, first run Monday 2026-11-09 08:00 Kyiv).
- Bot: every Monday after the digest hour sends «📈 Weekly owner report» to PM (and admin); `/weekly` shows it any time. If the article was not refreshed in the last 30 h, the message says so.

## Setup
    npm run seed:weekly

## Test
1. Knowledge has no action menu in the UI, so the report is run through the scheduled action: Settings → Technical (developer mode, `?debug=1`) → Scheduled Actions → «Opsline: weekly owner report» → Run Manually → the article gets figures + AI comment.
2. Telegram `/weekly` → same content with the «Report in Odoo» button.

## Limitations
- Scheduled AI runs consume Odoo AI credits of the trial; unverified how many credits a weekly run uses.
- Demo data: week-over-week comparison is meaningful only after a real week of activity.
