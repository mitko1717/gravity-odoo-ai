# ADR 0001 — AI provider: Odoo 20 native AI

- Status: accepted
- Date: 2026-11-05

## Context

Lead analysis needs an LLM. Two options were considered:

1. External service (Node.js) calling the Anthropic Claude API.
   Requires a paid API balance (about $5 would cover hundreds of test leads
   at roughly $0.001–0.003 per lead on a small model).
2. The AI features built into Odoo 20 (available in the Enterprise trial).

## Decision

Use Odoo 20 native AI. No budget was allocated for an external API in this
test assignment.

## Consequences

- No extra cost, no extra hosting, no secrets outside Odoo.
- Less control over model choice, structured output validation and per-call
  cost tracking; these are listed as limitations.
- The external Claude-based service remains a documented roadmap option
  (better validation, retries, idempotency, model routing by task complexity).
