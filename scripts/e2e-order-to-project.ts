import { OdooClient } from '../src/odoo-client.js';
import { QUOTATION_TEMPLATE_NAME } from '../src/config/sales-catalog.js';

interface TaskRow {
  id: number;
  name: string;
  date_deadline: string | false;
  depend_on_ids: number[];
}

const odoo = OdooClient.fromEnv();
const partnerId = await odoo.create('res.partner', { name: 'E2E Демо Клієнт', email: 'e2e.demo@example.com' });
const [templateId] = await odoo.search('sale.order.template', [['name', '=', QUOTATION_TEMPLATE_NAME]]);

if (templateId === undefined) throw new Error('quotation template not found, run seed:sales');

const templateLines = await odoo.searchRead<{ product_id: [number, string]; product_uom_qty: number }>(
  'sale.order.template.line',
  [['sale_order_template_id', '=', templateId], ['product_id', '!=', false]],
  ['product_id', 'product_uom_qty'],
);
const orderLines = templateLines.map((line) => [0, 0, { product_id: line.product_id[0], product_uom_qty: line.product_uom_qty }]);
const orderId = await odoo.create('sale.order', { partner_id: partnerId, sale_order_template_id: templateId, order_line: orderLines });
await odoo.call('sale.order', 'action_confirm', { ids: [orderId] });

const [order] = await odoo.searchRead<{ name: string; project_ids: number[] }>('sale.order', [['id', '=', orderId]], ['name', 'project_ids']);
const projectId = order?.project_ids[0];

if (projectId === undefined) throw new Error(`order ${order?.name} confirmed but no project created`);

const tasks = await odoo.call<TaskRow[]>('project.task', 'search_read', {
  domain: [['project_id', '=', projectId]],
  fields: ['id', 'name', 'date_deadline', 'depend_on_ids'],
  order: 'sequence, id',
});

console.log(`order ${order?.name} -> project ${projectId}, tasks: ${tasks.length}`);

for (const task of tasks) console.log(`  ${String(task.date_deadline).slice(0, 10)}  blocked by ${task.depend_on_ids.length}  ${task.name}`);

const firstTask = tasks[0];
if (!firstTask) throw new Error('no tasks');

await odoo.write('project.task', [firstTask.id], { date_deadline: '2026-11-01 16:00:00' });

const [cron] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'base_automation'], ['model', '=', 'ir.cron']], ['res_id'], 1);

// on_time rules only process records whose trigger date is after last_run; reset it so the test is repeatable.
const escalationIds = await odoo.search('base.automation', [['name', '=', 'Opsline: ескалація простроченої задачі']]);
await odoo.write('base.automation', escalationIds, { last_run: false });

if (cron) await odoo.call('ir.cron', 'method_direct_trigger', { ids: [cron.res_id] });

const activities = await odoo.searchRead<{ summary: string; user_id: [number, string] }>(
  'mail.activity',
  [['res_model', '=', 'project.task'], ['res_id', '=', firstTask.id]],
  ['summary', 'user_id'],
);

console.log('escalation activities:', activities.map((a) => `${a.summary} -> ${a.user_id[1]}`));
console.log(`open: ${process.env.ODOO_URL}/odoo/project/${projectId}/tasks`);
