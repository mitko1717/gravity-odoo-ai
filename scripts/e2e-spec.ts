import { OdooClient } from '../src/odoo-client.js';
import { QUOTATION_TEMPLATE_NAME } from '../src/config/sales-catalog.js';

// Lead with AI data: «Розумний дім, будинок 180 м² під Києвом» (synthetic eval set).
const LEAD_NAME = 'Розумний дім, будинок 180 м² під Києвом';

const odoo = OdooClient.fromEnv();
const [leadId] = await odoo.search('crm.lead', [['name', '=', LEAD_NAME]]);
if (leadId === undefined) throw new Error(`lead not found: ${LEAD_NAME}`);

const partnerId = await odoo.create('res.partner', { name: 'E2E Демо Клієнт', email: 'e2e.demo@example.com' });
const [templateId] = await odoo.search('sale.order.template', [['name', '=', QUOTATION_TEMPLATE_NAME]]);
if (templateId === undefined) throw new Error('quotation template not found, run seed:sales');

const templateLines = await odoo.searchRead<{ product_id: [number, string]; product_uom_qty: number }>(
  'sale.order.template.line',
  [['sale_order_template_id', '=', templateId], ['product_id', '!=', false]],
  ['product_id', 'product_uom_qty'],
);
const orderLines = templateLines.map((line) => [0, 0, { product_id: line.product_id[0], product_uom_qty: line.product_uom_qty }]);
const orderId = await odoo.create('sale.order', { partner_id: partnerId, opportunity_id: leadId, sale_order_template_id: templateId, order_line: orderLines });
await odoo.call('sale.order', 'action_confirm', { ids: [orderId] });

const [order] = await odoo.searchRead<{ name: string; project_ids: number[] }>('sale.order', [['id', '=', orderId]], ['name', 'project_ids']);
const projectId = order?.project_ids[0];
if (projectId === undefined) throw new Error('no project created');

const [actionId] = await odoo.search('ir.actions.server', [['name', '=', 'AI: чернетка специфікації']]);
if (actionId === undefined) throw new Error('run seed:spec first');

const startedAt = Date.now();
await odoo.call('ir.actions.server', 'run', {
  ids: [actionId],
  context: { active_id: projectId, active_ids: [projectId], active_model: 'project.project' },
});
const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);

const [project] = await odoo.searchRead<{ x_spec_lines: string | false }>('project.project', [['id', '=', projectId]], ['x_spec_lines']);
const [designTask] = await odoo.searchRead<{ description: string | false }>('project.task', [['project_id', '=', projectId], ['name', '=', 'Проєктування']], ['description']);
const text = String(designTask?.description || '').replace(/<\/(p|tr)>|<br\/?>/g, '\n').replace(/<[^>]+>/g, ' ');

console.log(`order ${order?.name} -> project ${projectId}, AI ${seconds} s`);
console.log('x_spec_lines:', JSON.stringify(project?.x_spec_lines));
console.log(text);
