import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

// Project automations: task deadlines from the template and escalation of overdue tasks to the manager.

const odoo = OdooClient.fromEnv();
const [taskModelId] = await odoo.search('ir.model', [['model', '=', 'project.task']]);
const [deadlineFieldId] = await odoo.search('ir.model.fields', [['model', '=', 'project.task'], ['name', '=', 'date_deadline']]);

if (taskModelId === undefined || deadlineFieldId === undefined) throw new Error('project.task model or date_deadline not found');

const automationFields = await odoo.call<Record<string, unknown>>('base.automation', 'fields_get', { attributes: ['type'] });
console.log('trigger date fields:', Object.keys(automationFields).filter((name) => name.startsWith('trg_date')).join(', '));

const [deadlinesCode, escalateCode] = await Promise.all([
  readFile('odoo/project/set-deadlines.py', 'utf8'),
  readFile('odoo/project/escalate-overdue.py', 'utf8'),
]);

async function ensureAutomation(name: string, values: Record<string, unknown>, code: string): Promise<number> {
  const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', name]], { name, model_id: taskModelId, ...values });

  await ensureRecord(odoo, 'ir.actions.server', [['name', '=', `${name} (code)`]], {
    name: `${name} (code)`,
    model_id: taskModelId,
    state: 'code',
    usage: 'base_automation',
    base_automation_id: automationId,
    code,
  });

  return automationId;
}

const deadlinesId = await ensureAutomation('Opsline: дедлайни задач проєкту', {
  trigger: 'on_create',
  filter_domain: "[('date_deadline', '=', False), '!', ('tag_ids.name', '=', 'AI-чернетка')]",
}, deadlinesCode);
console.log(`deadlines automation -> ${deadlinesId}`);

const escalateId = await ensureAutomation('Opsline: ескалація простроченої задачі', {
  trigger: 'on_time',
  trg_date_id: deadlineFieldId,
  trg_date_range: 1,
  trg_date_range_type: 'day',
  filter_domain: "[('state', 'not in', ['1_done', '1_canceled']), ('project_id.is_template', '=', False)]",
}, escalateCode);
console.log(`escalation automation -> ${escalateId}`);
