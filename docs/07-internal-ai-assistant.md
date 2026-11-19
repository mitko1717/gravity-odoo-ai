# 07 — Internal AI assistant (Knowledge-grounded)

## Problem
Employees ask the same questions (SLA, warranty, installation checklist, onboarding) in chats and calls.
Answers depend on who replies; new staff interrupt senior engineers.

## Solution (native Odoo 20, no code at runtime)
- 4 synthetic Knowledge articles (marked «demo», not the company's real policies):
  service & SLA, warranty, installation checklist, onboarding.
- AI agent «Opsline: internal assistant (demo)»: system prompt (English, sources only, name the article,
  say «not in sources» + whom to ask), **Restrict to Sources** on, default skills (Web Search, Generate Image) removed.
- Sources: the 4 articles, indexed with `gemini-embedding-2` (status Indexed).
- Where users open it: **AI app → Agents → agent card → chat** (requires module `ai_agentic`, the AI app).

## Setup
    npm run install:modules -- ai_agentic ai_agentic_knowledge
    npm run seed:knowledge     # articles, agent, sources; prints indexing status

## Test (2026-11-05, manual in UI) — generic «Odoo AI» vs restricted agent
| Question | Generic Odoo AI | Opsline assistant (restricted) |
|---|---|---|
| Smell of burning in the panel: what to do, reaction time? | Plausible but invented SLA («5–15 min», «30–60 min»), no source | Critical, reaction ≤ 2 h, visit same day, de-energize; cites «Service policy and SLA» |
| Warranty on installation, what is needed? | Correct (found the article) | 24 months; contract no., handover act, description; cites «Warranty» |
| How much does KNX setup cost? | Quoted 25 000 ₴ from the sales catalog | «Not in the regulations», refers to PM / administrator |

Conclusion: grounding + Restrict to Sources removes invented policy answers; a generic assistant is useful
for data questions, a restricted one for policies.

## Gotchas
- Without the `ai_agentic` app, custom agents exist but there is no UI to chat with them; Discuss / the AI
  icon open the generic «Odoo AI» agent.
- Knowledge articles need a member with Write access: use `internal_permission: 'write'` for workspace articles.

## Roadmap
- The client's real regulations as sources (PDF / Documents), owner per article, review dates.
- Expose the agent in Live Chat for customers (separate agent, customer-safe sources only).
