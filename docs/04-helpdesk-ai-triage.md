<!-- note: see «Known limitation» at the end -->
# 04 — Service tickets: AI triage + SLA (Helpdesk)

## Problem

Service requests arrive mixed: a burning smell in the switchboard and a request for a new lighting
scene land in the same queue. Urgency and the responsible engineer are decided manually.

## Flow

```text
Ticket created (email / portal / manual / API)
  → Automation Rule "Opsline: AI triage of a service request" (On create)
    → AI action "Opsline: AI ticket triage" (odoo/ticket-analysis/prompt.html)
      → tool opsline_get_ticket_data        ticket text as untrusted input
      → tool opsline_apply_ticket_analysis  category + urgency (enums) → validation (tool-code.py)
          → AI fields, native priority (drives SLA), engineer if unassigned, chatter note
```

## SLA policies (team «Northwind Service (demo)», target stage "In Progress")

| Priority | Response within |
|---|---|
| Urgent (critical) | 2 h |
| High | 8 h |
| Medium (normal) | 24 h |
| Low | no SLA |

Urgency rules in the prompt: critical = safety risk (burning smell, sparks, water near electrics,
no heating in winter, security down); high = a core system does not work; normal = partial issue;
low = change request or information.

## Verified (`npm run e2e:tickets`)

| Ticket | AI result | Priority / SLA |
|---|---|---|
| Burning smell from the switchboard | electrical / critical | Urgent, 2 h |
| App not working (light works from switches) | network / normal | Medium, 24 h |
| Add a scene «Movie» | lighting / low | Low, no SLA |

## SLA breach escalation (Telegram bot)
Rules, no AI: the bot polls `helpdesk.sla.status` (status `failed`, or `ongoing` with `deadline` < now) and sends
«🚨 SLA breached» to the PM (and the admin) once per SLA status, with «I take it» and an Odoo link.
`/stats` → Service shows the on-time share for 30 days: reached / (reached + failed). See [17](17-telegram-bot.md).

## Notes

- Unlike leads, AI here sets the native priority because SLA timers depend on it; the engineer can
  change it and the chatter shows it was set by AI.
- The reply draft is stored as a field only; nothing is sent to the customer automatically.
- In Odoo 20 SLA policies select tickets with `criteria_domain`, not a priority field.

## Known limitation
Urgency on borderline tickets is not fully deterministic: in regression runs «app not working» was classified
once as normal and once as high. The engineer can change priority (and SLA) on the ticket; a production version
should add explicit rules for safety keywords (smell of burning, sparks) and a review queue for borderline cases.
