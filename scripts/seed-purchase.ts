import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';
import { DONE_STAGE_NAME, EQUIPMENT, SPEC_TASK_NAME, VENDORS } from '../src/config/purchase-catalog.js';

// Purchase: demo vendors and the «specification approved → draft RFQs» automation.

const AUTOMATION_NAME = 'Opsline: specification approved → draft RFQs';

const odoo = OdooClient.fromEnv();

const vendorIds = new Map<string, number>();
for (const name of VENDORS) {
  const id = await ensureRecord(odoo, 'res.partner', [['name', '=', name]], { name, is_company: true, supplier_rank: 1 });
  vendorIds.set(name, id);
}

for (const item of EQUIPMENT) {
  const vendorId = vendorIds.get(item.vendor);

  if (vendorId === undefined) throw new Error(`unknown vendor: ${item.vendor}`);

  await ensureRecord(odoo, 'product.template', [['name', '=', item.name]], {
    name: item.name,
    type: 'consu',
    list_price: item.price,
    standard_price: item.cost,
    purchase_ok: true,
    sale_ok: true,
    seller_ids: [[5, 0, 0], [0, 0, { partner_id: vendorId, price: item.cost, min_qty: 1 }]],
  });
}
console.log(`vendors: ${vendorIds.size}, equipment: ${EQUIPMENT.length}`);

const [taskModelId] = await odoo.search('ir.model', [['model', '=', 'project.task']]);

if (taskModelId === undefined) throw new Error('project.task model not found');

const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', AUTOMATION_NAME]], {
  name: AUTOMATION_NAME,
  model_id: taskModelId,
  trigger: 'on_stage_set',
  filter_domain: `[('name', '=', '${SPEC_TASK_NAME}'), ('stage_id.name', '=', '${DONE_STAGE_NAME}'), ('project_id.is_template', '=', False)]`,
});

await ensureRecord(odoo, 'ir.actions.server', [['name', '=', `${AUTOMATION_NAME} (code)`]], {
  name: `${AUTOMATION_NAME} (code)`,
  model_id: taskModelId,
  state: 'code',
  usage: 'base_automation',
  base_automation_id: automationId,
  code: await readFile('odoo/purchase/spec-to-rfq.py', 'utf8'),
});
console.log(`purchase automation -> ${automationId}`);
