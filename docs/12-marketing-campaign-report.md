# 12 — Marketing: lead and campaign efficiency report

## Problem
Ad budgets are judged by lead count; nobody connects campaign spend with lead quality and sales outcome.
What customers actually ask for is buried in free-text requests.

## Solution
- Native UTM: campaigns (utm.campaign) with source / medium; leads carry campaign_id, source_id, medium_id
  (in production: Link Tracker URLs and website form UTM parameters).
- Field «Рекламний бюджет, грн (демо)» (x_ad_spend) on the campaign; synthetic spend for 3 demo campaigns.
- Every lead is analysed by the existing lead AI (02): priority and requested services.
- Knowledge article «Маркетинговий звіт по кампаніях (демо)», AI action «AI: маркетинговий звіт»:
  rules compute spend, leads, qualified leads (AI priority high/medium), quotations, cost per lead,
  cost per qualified lead, requested services; AI writes conclusions, demand summary, budget recommendations.

## Setup and test
    npm run seed:marketing   # spend field, sources, media, 3 campaigns, article, AI action
    npm run e2e:marketing    # 12 synthetic leads (removes previous ones), waits for lead AI, builds the report

Verified 2026-11-05 (12 leads, ~2 min): cost per qualified lead — partner newsletter 1 500, Google Ads 6 000,
Facebook lead form 18 000 UAH (1 of 5 qualified); AI recommended shifting budget from Facebook and narrowing
targeting. Small synthetic sample: shows the mechanism, not real campaign performance.

## Why this matters
Qualification by AI turns «leads» into «qualified leads», so campaigns are compared by what sales can use.

## Roadmap
- Import real spend from Google Ads / Meta (APIs or exports) daily; revenue per campaign from won deals.
- Weekly scheduled report to the marketing channel.
