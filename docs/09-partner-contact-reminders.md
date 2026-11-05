# 09 — Partnerships: contact reminders for designers, architects, developers

## Problem
Partners (interior designers, architects, developers) bring a large share of projects, but contact with them
depends on the manager's memory. Partners go silent unnoticed.

## Solution (rule-based, **no AI on purpose**)
- Contact tags «Партнер: дизайнер / архітектор / забудовник»; responsible manager = native «Salesperson» on the contact.
- Field «Партнер: останній контакт» (x_partner_last_contact).
- Daily automation «Gravity: нагадування про контакт з партнером» (on_time, 30 days after last contact):
  activity «Зв’язатися з партнером» (call) for the manager; skipped if such an activity is already open.
- Action menu → «Партнер: контакт відбувся»: sets today's date, posts a note, closes the open reminder.

## Setup and test
    npm run seed:partners   # field, tags, 4 synthetic partners (5 / 25 / 40 / 90 days), automation, action
    npm run e2e:partners    # scheduler twice + «контакт відбувся» on one partner

Verified 2026-11-05: reminders only for 40 and 90 days; second scheduler run created no duplicates;
«контакт відбувся» → date 2026-11-05, reminder closed.

## Notes
- on_time automations only process records whose trigger date is after `last_run`; the e2e resets it.
  In production every partner gets one reminder per silent period, the next one after a new contact date.
- Interval is one constant: CONTACT_INTERVAL_DAYS in src/config/partners.ts.

## Roadmap
- Last contact updated automatically from logged calls, meetings and emails with the partner.
- Partner dashboard: leads and revenue per partner (CRM source/referrer), partner tiers.
