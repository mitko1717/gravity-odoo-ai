import { mkdir, writeFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';

// Measured numbers for the metrics dashboard: plain counts from Odoo, no AI, no estimates.
const OUTPUT = 'tmp/metrics.json';

const odoo = OdooClient.fromEnv();
const count = (model: string, domain: unknown[]) => odoo.call<number>(model, 'search_count', { domain });
const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

const leadsByPriority: Record<string, number> = {};
for (const priority of ['high', 'medium', 'low']) leadsByPriority[priority] = await count('crm.lead', [['x_ai_priority', '=', priority]]);

const funnel = {
  leads: await count('crm.lead', [['x_ai_status', '!=', false]]),
  inWork: await count('crm.lead', [['x_ai_status', '!=', false], ['user_id', '!=', false], ['stage_id.sequence', '>', 1]]),
  quotations: await count('sale.order', []),
  confirmedOrders: await count('sale.order', [['state', '=', 'sale']]),
  projects: await count('project.project', [['is_template', '=', false], ['sale_order_id', '!=', false]]),
};

const leads = {
  byPriority: leadsByPriority,
  needsReview: await count('crm.lead', [['x_ai_status', '=', 'needs_review']]),
  withoutManager: await count('crm.lead', [['x_ai_status', '!=', false], ['user_id', '=', false]]),
};

const projects = {
  openTasks: await count('project.task', [['parent_id', '=', false], ['project_id.is_template', '=', false], ['stage_id.name', '!=', 'Готово']]),
  overdueTasks: await count('project.task', [['date_deadline', '<', now], ['parent_id', '=', false], ['project_id.is_template', '=', false], ['stage_id.name', '!=', 'Готово']]),
};

const service = {
  openTickets: await count('helpdesk.ticket', [['stage_id.fold', '=', false]]),
  slaReached: await count('helpdesk.sla.status', [['status', '=', 'reached']]),
  slaFailed: await count('helpdesk.sla.status', [['status', '=', 'failed']]),
  slaOngoing: await count('helpdesk.sla.status', [['status', '=', 'ongoing']]),
};

const operations = {
  rfqDraft: await count('purchase.order', [['state', '=', 'draft']]),
  rfqConfirmed: await count('purchase.order', [['state', '=', 'purchase']]),
  consultationsBooked: await count('calendar.event', [['appointment_type_id', '!=', false]]),
  applicants: await count('hr.applicant', [['x_ai_fit', '!=', false]]),
};

const metrics = { exportedAt: new Date().toISOString(), funnel, leads, projects, service, operations };

await mkdir('tmp', { recursive: true });
await writeFile(OUTPUT, JSON.stringify(metrics, null, 2));

console.log(`metrics written: ${OUTPUT}`);
