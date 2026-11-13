import { OdooClient, OdooError } from '../src/odoo-client.js';

// Lists records whose display name still contains Ukrainian letters, per model (read-only).
// Usage: npm run find:ukrainian
const MODELS = [
  'crm.lead', 'res.partner', 'sale.order', 'purchase.order', 'account.move', 'project.project', 'project.task',
  'helpdesk.ticket', 'hr.applicant', 'calendar.event', 'knowledge.article', 'product.template', 'mail.activity',
  'planning.slot', 'sign.template', 'utm.campaign', 'hr.job', 'crm.tag', 'crm.stage', 'project.task.type',
];
const UKRAINIAN = /[а-яіїєґА-ЯІЇЄҐ]/;
const SAMPLE_SIZE = 5;

const odoo = OdooClient.fromEnv();

for (const model of MODELS) {
  let rows: Array<{ id: number; display_name: string }>;

  try {
    rows = await odoo.searchRead(model, [], ['id', 'display_name']);
  } catch (error) {
    if (!(error instanceof OdooError)) throw error;
    console.log(`${model}: skipped (${error.status})`);
    continue;
  }

  const hits = rows.filter((row) => UKRAINIAN.test(row.display_name));
  if (hits.length === 0) continue;

  const sample = hits.slice(0, SAMPLE_SIZE).map((row) => `#${row.id} ${row.display_name}`).join(' | ');
  console.log(`${model}: ${hits.length}/${rows.length} · ${sample}`);
}
