import { OdooClient } from '../src/odoo-client.js';

const odoo = OdooClient.fromEnv();

const testLeads = await odoo.search('crm.lead', [['name', 'like', '(тест)']]);
if (testLeads.length > 0) await odoo.call('crm.lead', 'unlink', { ids: testLeads });
console.log(`leads removed: ${testLeads.length}`);

const e2ePartners = await odoo.search('res.partner', [['name', '=', 'E2E Демо Клієнт']]);
const orders = await odoo.searchRead<{ id: number; name: string; project_ids: number[] }>(
  'sale.order',
  ['|', ['partner_id', 'in', e2ePartners], ['order_line', '=', false]],
  ['id', 'name', 'project_ids'],
);
const orderIds = orders.map((order) => order.id);
const projectIds = orders.flatMap((order) => order.project_ids);

if (orderIds.length > 0) {
  await odoo.call('sale.order', 'action_cancel', { ids: orderIds });
  await odoo.call('sale.order', 'unlink', { ids: orderIds });
}

const orphanProjects = await odoo.search('project.project', [['partner_id', 'in', e2ePartners]]);
const archiveIds = [...new Set([...projectIds, ...orphanProjects])];

if (archiveIds.length > 0) await odoo.write('project.project', archiveIds, { active: false });
if (e2ePartners.length > 0) await odoo.call('res.partner', 'write', { ids: e2ePartners, vals: { active: false } });

console.log(`orders removed: ${orders.map((order) => order.name).join(', ') || 'none'}, projects archived: ${archiveIds.length}`);
