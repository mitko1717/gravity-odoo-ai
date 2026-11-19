# 08 — Procurement: approved specification → draft RFQs

## Problem
After the client approves the specification, someone re-types the equipment list into supplier requests.
Items get missed, the purchase starts late and blocks installation.

## Solution (rule-based, **no AI on purpose**)
Grouping order lines by vendor is deterministic; an LLM would add cost and risk without benefit.

    Project task «Specification approval with client» → stage «Done»
    → automation «Opsline: specification approved → draft RFQs» (on_stage_set, project.task)
    → for the project's sale order: goods lines grouped by the product's first vendor
    → one draft purchase.order per vendor (origin = sale order), activity «Review and send the RFQ to the vendor» for the PM
    → chatter note on the task; goods without a vendor are listed for manual purchase

## Guardrails
- Drafts only: nothing is sent to vendors; the buyer reviews quantities and prices.
- Idempotent: if draft/sent RFQs with the same origin exist, no new ones are created (note on the task).
- Demo vendors and equipment, prices marked «[demo price]».

## Setup and test
    npm run install:modules -- purchase
    npm run seed:purchase    # 2 demo vendors, 5 equipment products with vendor prices, automation
    npm run e2e:purchase     # adds equipment to the latest project order, moves the spec task to «Done» twice

Verified 2026-11-05 (order S00006): run 1 → P00001 «KNX Supplier (demo)» 112 800, P00002 «Electro Wholesale (demo)»
30 600 (incl. default 20% VAT), both draft; run 2 → same 2 RFQs, note «already exist».

## Gotchas
- Odoo Online rate-limits API calls (HTTP 429): avoid `Promise.all` bursts, batch reads with `['name', 'in', [...]]`.

## Roadmap
- Inventory: reserve stock first and buy only the shortage; receipt dates → «Installation» task start.
- Vendor price comparison (several vendors per product), purchase approval limits.
