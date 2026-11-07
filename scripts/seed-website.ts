import { OdooClient } from '../src/odoo-client.js';
import { FORM_FIELDS } from '../src/config/lead-fields.js';

// Allows the custom lead fields in website forms.

const odoo = OdooClient.fromEnv();
const names = FORM_FIELDS.map((field) => field.name);
const fieldIds = await odoo.search('ir.model.fields', [['model', '=', 'crm.lead'], ['name', 'in', names]]);

await odoo.write('ir.model.fields', fieldIds, { website_form_blacklisted: false });

console.log(`website form fields allowed: ${fieldIds.length}/${names.length}`);
