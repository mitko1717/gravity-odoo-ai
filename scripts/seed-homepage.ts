import { OdooClient } from '../src/odoo-client.js';
import { homepageArch } from '../src/website/homepage.js';

const odoo = OdooClient.fromEnv();
const views = await odoo.searchRead<{ id: number; website_id: [number, string] | false }>(
  'ir.ui.view',
  [['key', '=', 'website.homepage']],
  ['id', 'website_id'],
);
const target = views.find((view) => view.website_id && view.website_id[0] === 1) ?? views[0];

if (!target) throw new Error('website.homepage view not found');

await odoo.write('ir.ui.view', [target.id], { arch_db: homepageArch('website.homepage') });
await odoo.write('website', [1], { name: 'Smart Home — демо-стенд' });
await odoo.write('res.company', [1], {
  name: 'Демо-стенд Smart Home (тестове завдання)',
  phone: '+380 00 000 0000',
  email: 'demo@example.com',
});

console.log(`homepage view ${target.id} updated (website-specific: ${Boolean(target.website_id)})`);
console.log(`open: ${process.env.ODOO_URL}/`);
