import { writeFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { CASES, type EvalCase } from '../src/eval/dataset.js';

// AI quality eval: 18 synthetic leads → compares AI type, priority and budget with expected values (eval-results.md).

interface AiRow {
  x_ai_status: string | false;
  x_ai_client_type: string | false;
  x_ai_priority: string | false;
  x_ai_services: string | false;
  x_ai_budget_usd: number;
}

interface CaseResult {
  item: EvalCase;
  ms: number;
  row: AiRow | undefined;
  checks: Record<string, boolean | null>;
}

const BUDGET_TOLERANCE = 0.15;
const odoo = OdooClient.fromEnv();

const oldIds = await odoo.search('crm.lead', [['contact_name', 'like', 'Синтетичний клієнт']]);
if (oldIds.length > 0) await odoo.call('crm.lead', 'unlink', { ids: oldIds });

function evaluate(item: EvalCase, row: AiRow | undefined): Record<string, boolean | null> {
  if (!row) return { processed: false, clientType: false, services: null, priority: false, budget: null, review: null };

  const services = String(row.x_ai_services || '').split(',').map((s) => s.trim());
  const budgetExpected = item.expect.budgetUsd;
  const budgetOk = budgetExpected === undefined ? null : budgetExpected === 0 ? row.x_ai_budget_usd === 0 : Math.abs(row.x_ai_budget_usd - budgetExpected) / budgetExpected <= BUDGET_TOLERANCE;

  return {
    processed: row.x_ai_status === 'done' || row.x_ai_status === 'needs_review',
    clientType: item.expect.clientType.includes(String(row.x_ai_client_type)),
    services: item.expect.servicesAny ? item.expect.servicesAny.some((s) => services.includes(s)) : null,
    priority: item.expect.priorityIn.includes(String(row.x_ai_priority)),
    budget: budgetOk,
    review: item.expect.needsReview === undefined ? null : (row.x_ai_status === 'needs_review') === item.expect.needsReview,
  };
}

const results: CaseResult[] = [];

for (const item of CASES) {
  const started = Date.now();
  const leadId = await odoo.create('crm.lead', item.lead);
  const ms = Date.now() - started;
  const [row] = await odoo.searchRead<AiRow>('crm.lead', [['id', '=', leadId]], ['x_ai_status', 'x_ai_client_type', 'x_ai_priority', 'x_ai_services', 'x_ai_budget_usd']);

  results.push({ item, ms, row, checks: evaluate(item, row) });
  console.log(`${item.id} ${ms}ms ${JSON.stringify(results.at(-1)?.checks)}`);
}

function rate(key: string): string {
  const relevant = results.map((r) => r.checks[key]).filter((v): v is boolean => v !== null && v !== undefined);
  const passed = relevant.filter(Boolean).length;
  const percent = relevant.length === 0 ? 0 : Math.round((passed / relevant.length) * 100);

  return `${passed}/${relevant.length} (${percent}%)`;
}

const latencies = results.map((r) => r.ms).sort((a, b) => a - b);
const average = Math.round(latencies.reduce((sum, ms) => sum + ms, 0) / latencies.length);
const p95 = latencies[Math.min(latencies.length - 1, Math.ceil(latencies.length * 0.95) - 1)] ?? 0;
const reviewCount = results.filter((r) => r.row?.x_ai_status === 'needs_review').length;

const summary = [
  `| Metric | Result |`,
  `|---|---|`,
  `| Leads processed by AI | ${rate('processed')} |`,
  `| Client type accuracy | ${rate('clientType')} |`,
  `| Services detected (at least one expected) | ${rate('services')} |`,
  `| Priority within expected range | ${rate('priority')} |`,
  `| Budget extraction (±${BUDGET_TOLERANCE * 100}%, 0 when not stated) | ${rate('budget')} |`,
  `| Duplicate flagged for review | ${rate('review')} |`,
  `| Leads marked "needs review" | ${reviewCount}/${results.length} |`,
  `| Lead creation incl. AI, avg / p95 | ${average} ms / ${p95} ms |`,
];

const mark = (value: boolean | null | undefined): string => (value === null || value === undefined ? '—' : value ? '✅' : '❌');
const rows = results.map((r) => `| ${r.item.id} | ${r.item.note} | ${r.row?.x_ai_client_type} | ${r.row?.x_ai_priority} | ${r.row?.x_ai_budget_usd} | ${mark(r.checks.clientType)} | ${mark(r.checks.services)} | ${mark(r.checks.priority)} | ${mark(r.checks.budget)} | ${r.ms} |`);

const report = [
  '# Evaluation: AI lead analysis on 18 synthetic leads',
  '',
  `Run: ${new Date().toISOString()} · Odoo 20 native AI · dataset: \`src/eval/dataset.ts\` · script: \`npm run eval\``,
  '',
  ...summary,
  '',
  '| Case | Scenario | Client type | Priority | Budget USD | Type | Services | Priority | Budget | ms |',
  '|---|---|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  'Measured values only. Expected ranges are defined per case in the dataset; time savings for the real business are estimated separately.',
].join('\n');

await writeFile('docs/eval-results.md', `${report}\n`);
console.log(summary.join('\n'));
