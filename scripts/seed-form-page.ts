import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';
import { leadFormSection } from '../src/website/lead-form.js';

const KEY = 'website.gravity_zayavka';
const URL = '/zayavka';

const odoo = OdooClient.fromEnv();
const arch = `<t t-name="${KEY}"><t t-call="website.layout"><div id="wrap" class="oe_structure">${leadFormSection()}</div></t></t>`;

const viewId = await ensureRecord(odoo, 'ir.ui.view', [['key', '=', KEY]], {
  name: 'Залишити заявку',
  key: KEY,
  type: 'qweb',
  arch_db: arch,
});

const pageId = await ensureRecord(odoo, 'website.page', [['url', '=', URL]], {
  url: URL,
  view_id: viewId,
  website_id: 1,
  is_published: true,
  website_indexed: false,
});

const [rootMenu] = await odoo.searchRead<{ id: number }>('website.menu', [['website_id', '=', 1], ['parent_id', '=', false]], ['id'], 1);

if (!rootMenu) throw new Error('website root menu not found');

const menuId = await ensureRecord(odoo, 'website.menu', [['url', '=', URL], ['website_id', '=', 1]], {
  name: 'Залишити заявку',
  url: URL,
  parent_id: rootMenu.id,
  website_id: 1,
  sequence: 50,
});

console.log(`view ${viewId}, page ${pageId}, menu ${menuId}`);
console.log(`open: ${process.env.ODOO_URL}${URL}`);
