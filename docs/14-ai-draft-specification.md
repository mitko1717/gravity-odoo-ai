# 14 — Design: AI draft equipment specification (map stage 4)

## Problem
The engineer starts the design from scratch: re-reads the request, guesses quantities, then the purchase list is
typed again. The first draft is slow and the link «request → specification → purchase» is manual.

## Solution
Button «AI: чернетка специфікації» on the project (Action menu).

    read tool  → lead data (object type, city, area, AI-detected services, summary, client text marked UNTRUSTED)
                 + equipment catalog (purchasable products with a vendor)
    LLM        → lines {product_id, qty, reason_uk}, assumptions_uk, questions_uk
    apply tool → Python keeps only catalog products and qty 1..200, stores `x_spec_lines` on the project,
                 writes a table + assumptions + on-site questions into the task «Проєктування»
    engineer   → checks, edits, approves → task «Погодження специфікації з клієнтом» → «Готово»
    procurement→ RFQs are built from the approved `x_spec_lines` (fallback: order lines), see doc 08

## Guardrails
- AI can only pick existing catalog products; anything else is rejected and counted in the note.
- The draft is for an engineer, never sent to the client; RFQs appear only after a person sets «Готово».
- Missing data → conservative minimum, stated explicitly in assumptions.

## Setup and test
    npm run seed:spec         # field x_spec_lines on project.project + AI button
    npm run seed:purchase     # updated spec-to-rfq.py (uses x_spec_lines)
    npm run e2e:spec          # order linked to lead «Розумний дім, будинок 180 м² під Києвом» → AI draft

Verified 2026-11-05 (order S00009, project 10): AI 6.6 s, 5 lines (controller 1, power supply 1, actuators 2,
presence sensors 2, cable 2) with reasons, 4 assumptions, 5 on-site questions. After «Готово»: P00005 and P00006
with exactly these quantities.

## Limits
- Demo catalog of 5 items; real use needs Gravity's catalog, design rules (channels per room, cable per m²) and
  the engineer's corrections fed back as examples.
- Quantities are a starting point, not an engineering calculation.
