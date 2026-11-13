import { OdooClient } from '../src/odoo-client.js';
import { DONE_STAGE_NAME, EQUIPMENT, SPEC_TASK_NAME } from '../src/config/purchase-catalog.js';

interface Rfq {
  name: string;
  partner_id: [number, string];
  amount_total: number;
  state: string;
}

const QUANTITIES = [6, 2, 8, 1, 3];

const odoo = OdooClient.fromEnv();

const [project] = await odoo.call<Array<{ id: number; sale_order_id: [number, string] }>>('project.project', 'search_read', {
  domain: [['sale_order_id', '!=', false], ['is_template', '=', false]],
  fields: ['sale_order_id'],
  order: 'id desc',
  limit: 1,
});

if (!project) throw new Error('no project with a sale order, run e2e:project first');

const orderId = project.sale_order_id[0];
const orderName = project.sale_order_id[1];

// One request for all products: parallel calls hit Odoo Online rate limiting (429).
const names = EQUIPMENT.map((item) => item.name);
const products = await odoo.searchRead<{ id: number; name: string }>('product.product', [['name', 'in', names]], ['name']);
const idByName = new Map(products.map((product) => [product.name, product.id]));
const productIds = names.map((name) => {
  const id = idByName.get(name);

  if (id === undefined) throw new Error(`product not found: ${name}`);

  return id;
});
const lines = productIds.map((productId, index) => [0, 0, { product_id: productId, product_uom_qty: QUANTITIES[index] ?? 1 }]);
await odoo.write('sale.order', [orderId], { order_line: lines });
console.log(`project ${project.id}, order ${orderName}: +${lines.length} equipment lines`);

const [taskId] = await odoo.search('project.task', [['project_id', '=', project.id], ['name', '=', SPEC_TASK_NAME]]);
const [doneStageId] = await odoo.search('project.task.type', [['name', '=', DONE_STAGE_NAME], ['project_ids', 'in', [project.id]]]);
const [workStageId] = await odoo.search('project.task.type', [['name', '=', 'In progress'], ['project_ids', 'in', [project.id]]]);

if (taskId === undefined || doneStageId === undefined || workStageId === undefined) throw new Error('spec task or stages not found');

const readRfqs = () => odoo.searchRead<Rfq>('purchase.order', [['origin', '=', orderName]], ['name', 'partner_id', 'amount_total', 'state']);

for (const run of [1, 2]) {
  await odoo.write('project.task', [taskId], { stage_id: workStageId });
  await odoo.write('project.task', [taskId], { stage_id: doneStageId });

  const rfqs = await readRfqs();
  console.log(`run ${run}: ${rfqs.length} RFQ`);
  for (const rfq of rfqs) console.log(`  ${rfq.name} | ${rfq.partner_id[1]} | ${rfq.amount_total} | ${rfq.state}`);
}

const [lastNote] = await odoo.call<Array<{ body: string }>>('mail.message', 'search_read', {
  domain: [['model', '=', 'project.task'], ['res_id', '=', taskId], ['body', 'ilike', 'Purchasing']],
  fields: ['body'],
  order: 'id desc',
  limit: 1,
});
console.log(`last task note: ${lastNote?.body ?? '-'}`);
