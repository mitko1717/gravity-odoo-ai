# 15 — Crew planning and field visits (map stages 5 and 7)

## Problem
The PM plans who goes to which site in a chat or a spreadsheet. Overlaps between sites are found on the day,
installers learn about visits late, and the plan is not linked to the project.

## Solution (rule-based, **no AI on purpose**)
Module `planning_field_service` (in Odoo 20 Field Service is part of Planning).

    Project → Action «Запланувати бригади»
    → for field tasks with deadlines: «Виїзд на об’єкт» (engineer, 1 day), «Монтаж» (2 installers, 5 days),
      «Налаштування та програмування» (engineer, 3 days), «Тестування системи» (1), «Здача клієнту та навчання» (1)
    → DRAFT planning.slot per task (role, resources, dates ending on the task deadline, linked sales order)
    → note on the project: created / skipped / shifts with overlaps; the PM checks and publishes in Planning

## Guardrails
- Drafts only: employees get nothing until the PM publishes the shifts.
- Idempotent: a shift with the same «project — task» name is not created twice.
- Durations and roles are demo assumptions (`odoo/planning/plan-crew.py`); crew is synthetic (2 installers, 1 engineer).

## Setup and test
    npm run install:modules -- planning_field_service
    npm run seed:planning     # roles, synthetic employees, project action
    npm run e2e:planning      # runs the action twice on the latest project

Verified 2026-11-05 (project 10): 5 draft shifts with correct roles and dates (installation 2026-12-06 → 12-10,
2 installers), 0 overlaps, second run created no duplicates. Site status during installation: AI report, doc 10.

## Roadmap
- Real norms (days per m², per system), employee skills (`planning_hr_skills` is installed) and availability.
- Mobile worksheets with photos and the client's signature on site.
