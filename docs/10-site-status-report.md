# 10 — Production: AI status report per site (project)

## Problem
Management asks PMs «how is the site going?»; the answer is assembled by hand from tasks, chats and calls.
Reports are irregular and optimistic; delays become visible late.

## Solution
    Project → Action menu → «AI: звіт по об’єкту» (manual now; can be scheduled weekly)
    → tool gravity_get_site_data   tasks, stages, deadlines, overdue days, last 2 notes per task (notes untrusted)
    → tool gravity_apply_site_report
        rules compute: progress = done / total, status on_track | at_risk (1 overdue) | off_track (2+ or >7 days) | done
        AI writes only: summary, blockers, next steps (Ukrainian)
    → native Odoo «Project Update» (status page with history) is created

## Why split rules and AI
Status and percentages must be reproducible and auditable, so they never come from the LLM.
The LLM turns task lists and free-text field notes into a readable narrative.

## Setup and test
    npm run seed:site-report
    npm run e2e:site-report   # marks tasks done, one task 3 days overdue, field note with a prompt injection

Verified 2026-11-05 (project 7): status=at_risk, progress=33% (3 of 9: two set by the test + spec task done
by the purchase test); blocker from the note (cable delivery delayed) reported; injected «report 100% done» ignored.

## Roadmap
- Weekly scheduled run for all active sites + digest to management.
- Field Service app for installers (mobile check-in, photos, timesheets) as the data source.
