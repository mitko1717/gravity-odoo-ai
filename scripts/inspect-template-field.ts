import { OdooClient } from '../src/odoo-client.js';

const odoo = OdooClient.fromEnv();
const fields = await odoo.call<Record<string, { string: string; type: string }>>('sale.order', 'fields_get', { attributes: ['string', 'type'] });

for (const [name, meta] of Object.entries(fields)) {
  if (name.includes('template')) console.log(`field ${name}: ${meta.type} "${meta.string}"`);
}

const views = await odoo.call<{ views: { form: { arch: string } } }>('sale.order', 'get_views', { views: [[false, 'form']] });
const lines = views.views.form.arch.split('\n').filter((line) => line.includes('template'));

for (const line of lines) console.log('arch:', line.trim().slice(0, 300));
