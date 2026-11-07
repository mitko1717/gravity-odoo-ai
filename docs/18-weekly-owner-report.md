# 18 — Weekly owner report (scheduled AI)

## Problem
The owner sees the business through separate screens (CRM, Sales, Project, Helpdesk) and asks managers for a weekly summary by hand.

## Solution
- Knowledge article «Тижневий звіт керівнику (демо)»: every run of the AI action «AI: тижневий звіт керівнику» (`odoo/weekly-report/`) adds a child article «Тижневий звіт — YYYY-MM-DD» (an archive of weeks). Writing into the parent body was overwritten by the collaborative editor when the article was open in a browser.
- Read tool computes the figures by rules: leads this/previous week, high priority, needs review, without manager; confirmed orders and amount; overdue project tasks with examples; open and critical tickets, SLA reached/failed this week.
- AI writes only 3 sentences and 1–3 attention items; the figures in the article are rendered by code, not by the model.
- Scheduled action «Gravity: тижневий звіт керівнику» (`ir.cron`, weekly, first run Monday 2026-11-09 08:00 Kyiv).
- Bot: every Monday after the digest hour sends «📈 Тижневий звіт керівнику» to PM (and admin); `/weekly` shows it any time. If the article was not refreshed in the last 30 h, the message says so.

## Setup
    npm run seed:weekly

## Test
1. Knowledge has no action menu in the UI, so the report is run through the scheduled action: Settings → Technical (developer mode, `?debug=1`) → Scheduled Actions → «Gravity: тижневий звіт керівнику» → Run Manually → the article gets figures + AI comment.
2. Telegram `/weekly` → same content with the «Звіт в Odoo» button.

## Limitations
- Scheduled AI runs consume Odoo AI credits of the trial; unverified how many credits a weekly run uses.
- Demo data: week-over-week comparison is meaningful only after a real week of activity.
