# 03 — Quotation → Sales order → Project → Tasks → Overdue escalation

## Flow

1. Manager opens the qualified lead → **New Quotation** → field **Template** (tab "Other Info")
   → «Розумний дім — базова пропозиція (демо)». Lines and tags are copied from the lead.
2. **Confirm** → Odoo natively creates a project from «Шаблон: впровадження розумного дому»
   (product «Впровадження «Розумний дім» (пакет робіт)» has *Create on Order = Project*).
   No custom code is involved in this step.
3. Automation **«Gravity: дедлайни задач проєкту»** (project.task, on create) sets planned deadlines.
4. Automation **«Gravity: ескалація простроченої задачі»** (1 day after deadline, unfinished tasks)
   creates an activity for the project manager and posts a chatter note.

## Project template

9 tasks with sequential dependencies ("Blocked by"), stages: До виконання → В роботі → На перевірці → Готово.

| # | Task | Deadline (days from start, demo assumption) |
|---|---|---|
| 1 | Уточнення технічних вимог | 2 |
| 2 | Виїзд на об’єкт | 5 |
| 3 | Проєктування | 12 |
| 4 | Погодження специфікації з клієнтом | 15 |
| 5 | Закупівля обладнання | 25 |
| 6 | Монтаж | 35 |
| 7 | Налаштування та програмування | 40 |
| 8 | Тестування системи | 42 |
| 9 | Здача клієнту та навчання | 45 |

## Demo catalog

All products are services marked **[демо-ціна]**; prices are placeholders, not Gravity prices.
The package line (1 ₴) is a technical marker that triggers project creation.

## Verified (`npm run e2e:project`)

order S00003 -> project 3, tasks: 9
2026-11-07 blocked by 0 Уточнення технічних вимог
...
2026-12-20 blocked by 1 Здача клієнту та навчання
escalation activities: [ 'Прострочено: Уточнення технічних вимог -> dm h' ]


## Notes and limitations

- Quotation templates have no settings toggle in Odoo 20; the field is labelled "Template".
- Creating an order through the API does not run the template onchange, so the e2e script copies template lines explicitly.
- Server action code runs in a sandbox: no attribute assignment (`record.field = x`), use `record.write({...})`.
- Overdue checks run on the Odoo automation cron (hourly on Odoo Online); the e2e test triggers it manually.
