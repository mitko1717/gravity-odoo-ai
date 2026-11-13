import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

// Every new lead gets a contact (existing by email or a new one): the quotation, project and
// consultation booking then point to the same client instead of an empty «Contact» field.
const AUTOMATION_NAME = 'Opsline: контакт клієнта з ліда';

const odoo = OdooClient.fromEnv();
const [leadModelId] = await odoo.search('ir.model', [['model', '=', 'crm.lead']]);
if (leadModelId === undefined) throw new Error('crm.lead model not found');

const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', AUTOMATION_NAME]], {
  name: AUTOMATION_NAME,
  model_id: leadModelId,
  trigger: 'on_create',
});

const actionId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', `${AUTOMATION_NAME} (code)`]], {
  name: `${AUTOMATION_NAME} (code)`,
  model_id: leadModelId,
  state: 'code',
  usage: 'base_automation',
  base_automation_id: automationId,
  code: await readFile('odoo/lead-contact/assign-partner.py', 'utf8'),
});

console.log(`lead contact automation -> ${automationId}, action -> ${actionId}`);
