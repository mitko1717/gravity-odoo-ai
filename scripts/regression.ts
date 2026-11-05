import { spawnSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';

// Runs every end-to-end check one by one (Odoo Online rate-limits parallel calls) and writes a summary.
// Each step is a real API scenario against Odoo; full output goes to tmp/regression.txt.
const STEPS: Array<[script: string, step: string]> = [
  ['eval', '1–2 Lead → AI analysis (18 synthetic leads)'],
  ['e2e:marketing', '1 Marketing campaign report'],
  ['e2e:partners', '1 Partner contact reminders'],
  ['e2e:project', '2–5 Order → project with 9 stages'],
  ['e2e:contract', '3 Contract + prepayment invoice'],
  ['e2e:spec', '4 AI draft specification'],
  ['e2e:purchase', '6 Specification → draft RFQs'],
  ['e2e:planning', '5/7 Crew planning'],
  ['e2e:site-report', '7 Site status report'],
  ['e2e:handover', '8–9 Commissioning checklist and handover'],
  ['e2e:tickets', '10 Service ticket AI triage + SLA'],
  ['e2e:applicants', 'HR applicant AI profile'],
  ['e2e:meetings', 'Meeting transcript → tasks'],
  ['e2e:finance', 'Finance management report'],
];

const SUMMARY = 'tmp/regression-summary.md';
const LOG = 'tmp/regression.txt';

const rows: string[] = [];
const log: string[] = [];
let failed = 0;

for (const [script, step] of STEPS) {
  const started = Date.now();
  const run = spawnSync('npm', ['run', '--silent', script], { encoding: 'utf8' });
  const seconds = ((Date.now() - started) / 1000).toFixed(1);
  const ok = run.status === 0;
  if (!ok) failed += 1;

  log.push(`===== ${script} (${ok ? 'OK' : 'FAIL'}, ${seconds} s)`, run.stdout, run.stderr);
  rows.push(`| ${step} | \`${script}\` | ${ok ? '✅' : '❌'} | ${seconds} s |`);
  console.log(`${ok ? '✅' : '❌'} ${script} (${seconds} s)`);
}

const header = ['# Regression run', '', `Run: ${new Date().toISOString()} · failed: ${failed}/${STEPS.length}`, '', '| Process step | Script | Result | Time |', '|---|---|---|---|'];

await mkdir('tmp', { recursive: true });
await writeFile(LOG, log.join('\n'));
await writeFile(SUMMARY, [...header, ...rows, ''].join('\n'));

console.log(`\nfailed ${failed}/${STEPS.length} · summary: ${SUMMARY} · log: ${LOG}`);
process.exitCode = failed === 0 ? 0 : 1;
