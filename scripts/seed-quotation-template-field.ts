import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

// Odoo 20 places «Quotation Template» after company_id, which is hidden in single-company databases.
// This small inherited view shows the field right after the customer.
const VIEW_NAME = 'Gravity: quotation template next to customer';
const ARCH = `<data>
  <field name="partner_id" position="after">
    <field name="sale_order_template_id" string="Шаблон пропозиції" options="{'no_create': True}" readonly="state in ['cancel', 'sale']"/>
  </field>
</data>`;

const odoo = OdooClient.fromEnv();
const [parentId] = await odoo.search('ir.ui.view', [['model', '=', 'sale.order'], ['type', '=', 'form'], ['inherit_id', '=', false]]);
if (parentId === undefined) throw new Error('sale.order base form view not found');

const viewId = await ensureRecord(odoo, 'ir.ui.view', [['name', '=', VIEW_NAME]], {
  name: VIEW_NAME,
  model: 'sale.order',
  type: 'form',
  inherit_id: parentId,
  mode: 'extension',
  priority: 99,
  arch_db: ARCH,
});
console.log(`quotation template field view -> ${viewId} (inherits ${parentId})`);
