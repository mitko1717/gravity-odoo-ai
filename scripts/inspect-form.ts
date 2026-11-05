import { OdooClient } from '../src/odoo-client.js';

const odoo = OdooClient.fromEnv();
const mails = await odoo.call<Array<{ id: number; subject: string; model: string | false; state: string }>>(
  'mail.mail',
  'search_read',
  { domain: [['subject', 'ilike', 'квартир']], fields: ['id', 'subject', 'model', 'state'], limit: 5 },
);
const formModels = await odoo.searchRead<{ model: string; website_form_label: string | false; website_form_access: boolean }>(
  'ir.model',
  [['website_form_access', '=', true]],
  ['model', 'website_form_label', 'website_form_access'],
);

console.log('mails:', mails);
console.log('form models:', formModels.map((m) => `${m.model} (${m.website_form_label})`).join(', '));
