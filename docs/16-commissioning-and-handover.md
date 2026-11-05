# 16 — Commissioning checklist and handover (map stages 8 and 9)

## Problem
Tests are done «from memory»; what was checked is not recorded, the handover starts before all checks pass,
and the client email with installed equipment and warranty is written by hand every time.

## Solution
    Task «Тестування системи» → Action «AI: протокол пусконалагодження»
    → read tool: approved specification (x_spec_lines) + requested services (lead); client text marked UNTRUSTED
    → LLM: 5-15 checks {subsystem, check with expected result}
    → apply tool: sub-tasks «Перевірка [підсистема]: …» (max 15, idempotent); the engineer closes each one

    «Тестування системи» → «Готово»   (automation «Gravity: тести пройдено → здача клієнту», rule, no AI)
    → open checks left → note «Здача заблокована», nothing else happens
    → all checks closed → activity for the PM on «Здача клієнту та навчання»: send the acceptance act (Sign
      template «Акт приймання (демо)») and the client email

    Project → Action «AI: лист клієнту при здачі»
    → facts only: installed equipment, completed checks, warranty (24 months, demo contract term), service contact
    → draft saved into the handover task description; the PM edits and sends it

## Guardrails
- AI never closes checks, never moves stages and never sends anything.
- The gate is a rule: handover cannot start with open checks.

## Setup and test
    npm run seed:handover     # 2 AI actions + gate automation
    npm run e2e:handover      # checklist → «Готово» with open checks → close → «Готово» → email draft

Verified 2026-11-05 (project 10): 7 checks in 6.6 s (security, climate, lighting x3, KNX bus x2), all tied to the
spec; first «Готово» with open checks created no activity, second created one activity; email draft in 6.4 s lists
exactly the installed equipment and the warranty, no invented promises.

## Limits
- Checks are as good as the specification; a real protocol needs Gravity's test standards per subsystem.
