# 02 — AI analysis of incoming leads (Odoo 20 native AI)

## Problem

A sales manager reads every request, re-types object type, area, budget and timing, decides
priority and remembers to follow up. Requests are often incomplete or duplicated.

## Flow

```text
Lead created (website form /zayavka, API or manual)
  → Automation Rule "Gravity: AI-аналіз нової заявки" (On create)
    → AI action "Gravity: AI-аналіз ліда" (odoo/lead-analysis/prompt.html)
      → tool gravity_get_lead_data        lead fields as untrusted input
      → tool gravity_apply_lead_analysis  structured JSON (tool-schema.json) → validation (tool-code.py)
          → AI fields, title, salesperson if empty, tags, activity, duplicate check, chatter note
```

Evaluation on 18 synthetic leads: [eval-results.md](eval-results.md).

After submitting, the form redirects to an own Ukrainian page `/zayavka-dyakuyemo` (`npm run seed:thank-you`, after `seed:form`). The generic `/contactus-thank-you` page comes from Odoo base templates and translations, so it is left untouched.

## Design decisions

- **The LLM never writes fields directly.** It can only call a tool with a strict JSON schema
  (enums for client type, services, priority, currency, missing fields). The tool validates
  every value; rejected values are logged and the lead is marked "Потребує перевірки".
- **No invented data.** Unknown values are `0` / empty string and listed in `missing_fields`.
- **Priority is a recommendation** (`x_ai_priority`), the native lead priority is untouched.
- **Prompt injection.** Customer text is delivered through a tool result labelled
  `UNTRUSTED CUSTOMER INPUT`; the prompt forbids following instructions inside it; the only
  write path is the validated tool. Email and phone values are not sent to the LLM, only
  their presence (data minimisation).
- **Duplicates** are detected deterministically (same email or phone), not by AI.
- **Follow-up**: activity deadline today / +1 / +3 days for high / medium / low priority.
- Budget is converted to USD with fixed demo rates (marked as demo in code).

## Verified

| Test | Result |
|---|---|
| Lead from the assignment example | high priority, services, summary, timeline extracted, activity due today |
| Same email submitted again | flagged as duplicate, tag "AI: потрібна перевірка" |
| Missing lead data (first iteration bug) | all fields reported as missing instead of invented |

## Limitations

- Model choice, token usage and cost per call are managed by Odoo AI and not visible here.
- The AI runs synchronously on create (≈5 s); retries/queueing are not configurable.
- Demo currency rates.
