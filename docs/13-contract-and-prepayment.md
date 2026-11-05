# 13 — Contract and prepayment (map stage 3)

## Problem
After the quotation is accepted, the manager prepares the contract and the invoice by hand, and the PM learns
about the payment from a message or a call. Work either starts before payment or waits for no reason.

## Solution (rule-based, **no AI on purpose**)
Amounts and statuses are deterministic; an LLM adds nothing here.

    Sales order confirmed (state → sale)
    → automation «Gravity: замовлення підтверджено → рахунок на передоплату» (on_write, sale.order)
    → native down-payment wizard creates a DRAFT invoice for 30% (not posted, not sent)
    → chatter note on the order + activity for the salesperson «Надіслати договір на підпис і рахунок на передоплату»
    → the manager sends the contract from the Sign template «Договір (демо)» and posts/sends the invoice

    Customer invoice paid (payment_state → paid / in_payment)
    → automation «Gravity: передоплату отримано → PM запускає закупівлі» (on_write, account.move)
    → note on the project + activity for the PM «Передоплату отримано: запустити закупівлі»

## Guardrails
- Nothing leaves the company automatically: the invoice stays a draft, the contract is sent by a person.
- Idempotent: no new prepayment invoice if the order already has a non-cancelled invoice.
- Sign templates are synthetic PDFs marked «ДЕМО-ДОКУМЕНТ, не має юридичної сили» (`data/sign/`).
- Rules fire only on the transition (pre-domain), not on every save.

## Setup and test
    npm run seed:contract     # two automations + code from odoo/contract/
    npm run e2e:contract      # order → draft 30% invoice → post → register payment → project activity

Sign templates were created in the UI (Sign → Upload PDF): «Договір (демо)» (Customer + Виконавець signatures)
and «Акт приймання (демо)» (signatures + date). Creating Sign templates through the API was not attempted.

Verified 2026-11-05 (order S00008, total 441 001.20): draft invoice 132 300.36 (30%), order activity created;
after posting and registering the payment → `paid`, project activity «Передоплату отримано: запустити закупівлі».

## Gotchas
- JSON-2 API accepts `context` in the request body: the payment wizard needs `active_model` / `active_ids`.
- Sign editor saved some fields twice; duplicates were removed via `sign.item` (one per template/type/role).

## Roadmap
- Send the contract from the order with one button (prefilled signer), block the project start until signed.
- Bank statement import → automatic reconciliation instead of manual payment registration.
