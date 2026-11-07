import { OdooClient } from '../src/odoo-client.js';
import { QUOTATION_TEMPLATE_NAME } from '../src/config/sales-catalog.js';

// E2E: confirmed order → 30% prepayment invoice → payment → PM gets the «start purchasing» task.

interface InvoiceRow {
  id: number;
  name: string;
  state: string;
  amount_total: number;
  payment_state: string;
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

const [order] = await odoo.searchRead<{ name: string; amount_total: number; invoice_ids: number[]; project_ids: number[] }>(
  'sale.order', [['id', '=', orderId]], ['name', 'amount_total', 'invoice_ids', 'project_ids'],
);
const invoices = await odoo.searchRead<InvoiceRow>('account.move', [['id', 'in', order?.invoice_ids ?? []]], ['name', 'state', 'amount_total', 'payment_state']);
const orderActivities = await odoo.searchRead<{ summary: string }>('mail.activity', [['res_model', '=', 'sale.order'], ['res_id', '=', orderId]], ['summary']);

console.log(`order ${order?.name} total ${order?.amount_total}, project ${order?.project_ids[0]}`);
console.log('invoices:', invoices.map((inv) => `${inv.state} ${inv.amount_total}`));
console.log('order activities:', orderActivities.map((a) => a.summary));

const invoice = invoices[0];
if (!invoice) throw new Error('no prepayment invoice created');

await odoo.call('account.move', 'action_post', { ids: [invoice.id] });

const paymentContext = { active_model: 'account.move', active_ids: [invoice.id] };
const wizardIds = await odoo.call<number[]>('account.payment.register', 'create', { vals_list: [{}], context: paymentContext });
await odoo.call('account.payment.register', 'action_create_payments', { ids: wizardIds, context: paymentContext });

const [paid] = await odoo.searchRead<InvoiceRow>('account.move', [['id', '=', invoice.id]], ['name', 'state', 'amount_total', 'payment_state']);
console.log(`invoice ${paid?.name}: ${paid?.state}, payment ${paid?.payment_state}`);

const projectId = order?.project_ids[0] ?? 0;
const projectActivities = await odoo.searchRead<{ summary: string }>('mail.activity', [['res_model', '=', 'project.project'], ['res_id', '=', projectId]], ['summary']);
console.log('project activities:', projectActivities.map((a) => a.summary));
