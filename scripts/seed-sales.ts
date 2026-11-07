import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';
import { PRODUCTS, PROJECT_TEMPLATE_NAME, QUOTATION_TEMPLATE_NAME, TASK_STAGES, TEMPLATE_TASKS } from '../src/config/sales-catalog.js';

// Sales → Project: task stages, the 9-step project template and the quotation template.

const odoo = OdooClient.fromEnv();

const stageIds: number[] = [];
for (const [index, name] of TASK_STAGES.entries()) {
  stageIds.push(await ensureRecord(odoo, 'project.task.type', [['name', '=', name]], { name, sequence: index }));
}

const templateId = await ensureRecord(odoo, 'project.project', [['name', '=', PROJECT_TEMPLATE_NAME]], {
  name: PROJECT_TEMPLATE_NAME,
  is_template: true,
  allow_task_dependencies: true,
  type_ids: [[6, 0, stageIds]],
});

let previousTaskId: number | null = null;
for (const [index, name] of TEMPLATE_TASKS.entries()) {
  const dependsOn = previousTaskId === null ? [] : [previousTaskId];
  const taskId = await ensureRecord(odoo, 'project.task', [['project_id', '=', templateId], ['name', '=', name]], {
    name,
    project_id: templateId,
    sequence: index,
    stage_id: stageIds[0],
    depend_on_ids: [[6, 0, dependsOn]],
  });
  previousTaskId = taskId;
}
console.log(`project template ${templateId}: ${TEMPLATE_TASKS.length} tasks with sequential dependencies`);

const productIds: number[] = [];
for (const product of PRODUCTS) {
  const tracking = product.createsProject ? { service_tracking: 'project_only', project_template_id: templateId } : {};
  productIds.push(await ensureRecord(odoo, 'product.template', [['name', '=', product.name]], {
    name: product.name,
    type: 'service',
    list_price: product.price,
    sale_ok: true,
    ...tracking,
  }));
}
console.log(`products: ${productIds.length}`);

const variantIds = await odoo.search('product.product', [['product_tmpl_id', 'in', productIds]]);
const lines = variantIds.map((productId, index) => [0, 0, { product_id: productId, product_uom_qty: 1, sequence: index }]);
const quotationTemplateId = await ensureRecord(odoo, 'sale.order.template', [['name', '=', QUOTATION_TEMPLATE_NAME]], {
  name: QUOTATION_TEMPLATE_NAME,
  number_of_days: 14,
  sale_order_template_line_ids: [[5, 0, 0], ...lines],
});
console.log(`quotation template ${quotationTemplateId}`);
