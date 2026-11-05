# 08 — Procurement: approved specification → draft RFQs

## Problem
After the client approves the specification, someone re-types the equipment list into supplier requests.
Items get missed, the purchase starts late and blocks installation.

## Solution (rule-based, **no AI on purpose**)
Grouping order lines by vendor is deterministic; an LLM would add cost and risk without benefit.

    Project task «Погодження специфікації з клієнтом» → stage «Готово»
    → automation «Gravity: специфікація погоджена → чернетки RFQ» (on_stage_set, project.task)
    → for the project's sale order: goods lines grouped by the product's first vendor
    → one draft purchase.order per vendor (origin = sale order), activity «Перевірити й надіслати RFQ» for the PM
    → chatter note on the task; goods without a vendor are listed for manual purchase

## Guardrails
- Drafts only: nothing is sent to vendors; the buyer reviews quantities and prices.
- Idempotent: if draft/sent RFQs with the same origin exist, no new ones are created (note on the task).
- Demo vendors and equipment, prices marked «[демо-ціна]».

## Setup and test
    npm run install:modules -- purchase
    npm run seed:purchase    # 2 demo vendors, 5 equipment products with vendor prices, automation
    npm run e2e:purchase     # adds equipment to the latest project order, moves the spec task to «Готово» twice

Verified 2026-11-05 (order S00006): run 1 → P00001 «Постачальник KNX (демо)» 112 800, P00002 «Електротехніка Опт (демо)»
30 600 (incl. default 20% VAT), both draft; run 2 → same 2 RFQs, note «вже існують».

## Gotchas
- Odoo Online rate-limits API calls (HTTP 429): avoid `Promise.all` bursts, batch reads with `['name', 'in', [...]]`.

## Roadmap
- Inventory: reserve stock first and buy only the shortage; receipt dates → «Монтаж» task start.
- Vendor price comparison (several vendors per product), purchase approval limits.
