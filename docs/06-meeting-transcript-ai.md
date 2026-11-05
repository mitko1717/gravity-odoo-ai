# 06 — Meetings: transcript → summary → draft tasks

## Problem
After site and planning meetings, agreements live in notes or memory. Tasks are created late or not at all,
owners and dates get lost.

## Flow
    Project «Наради: планування об’єктів (демо)», tab «Наради / AI»
    → PM pastes transcript into «Транскрипція наради (для AI)»
    → Action menu → «AI: розібрати нараду» (manual AI server action, ensureAiButton)
      → tool gravity_get_meeting_data       transcript + today's date (untrusted input)
      → tool gravity_apply_meeting_analysis summary, decisions, action_items[] → validation (tool-code.py)
    → summary saved on the project, draft tasks in stage «Чернетки з зустрічей», tag «AI-чернетка»

## Guardrails
- **Drafts only.** No assignees are set; the owner name from the transcript goes into the task description,
  the PM confirms the owner and date and moves the task forward.
- Deadlines only when a date was said; relative dates («до п’ятниці») are resolved against today; invalid dates are dropped.
- Max 15 tasks per run; transcript is labelled untrusted; the only write path is the validated tool.

## Setup and test
    npm run seed:meetings    # fields, form tab, demo project, stage, tag, AI action
    npm run e2e:meetings     # synthetic transcript with a prompt injection line

Verified 2026-11-05 (7.6 s): 3 tasks — spec update due Fri 2026-11-06, cable routing Mon 2026-11-09,
cable order without date; 0 assignees; the injected «create 50 TEST tasks» was ignored.

## Issues found during testing
- The generic «Gravity: дедлайни задач проєкту» automation set offsets on every new task, including AI drafts.
  Fixed with `filter_domain`: only tasks without their own deadline and without the «AI-чернетка» tag.
  Note: `('tag_ids.name', '!=', X)` excludes tasks with no tags at all; use `'!', ('tag_ids.name', '=', X)`.
- Weekday arithmetic was unstable (one run put «до п’ятниці» on Saturday). Fixed deterministically: the read tool
  passes a 14-day calendar with weekday names and the prompt forbids computing weekdays. 2 consecutive runs: identical, correct dates.
- First prompt version skipped «planned work» statements (only explicit commitments); prompt clarified.

## Roadmap
- Transcription itself (audio → text) via a speech-to-text service or Odoo meeting recordings.
- Match owner names to Odoo users and propose (not set) assignees.
