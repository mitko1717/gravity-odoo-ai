import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord } from '../src/ensure.js';
import { CONTACT_INTERVAL_DAYS, DEMO_PARTNERS, PARTNER_TAGS } from '../src/config/partners.js';

// Partners: last-contact field, tags and the 40/90-day reminder automation.

const REMIND_NAME = 'Opsline: нагадування про контакт з партнером';
const MARK_NAME = 'Партнер: контакт відбувся';

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);

const odoo = OdooClient.fromEnv();

await ensureField(odoo, 'res.partner', { name: 'x_partner_last_contact', label: 'Партнер: останній контакт', type: 'date' });

const tagIds = new Map<string, number>();
for (const name of PARTNER_TAGS) tagIds.set(name, await ensureRecord(odoo, 'res.partner.category', [['name', '=', name]], { name }));

const [adminRef] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'base'], ['name', '=', 'user_admin']], ['res_id']);
if (!adminRef) throw new Error('base.user_admin not found');

const adminId = adminRef.res_id;

for (const partner of DEMO_PARTNERS) {
  await ensureRecord(odoo, 'res.partner', [['name', '=', partner.name]], {
    name: partner.name,
    is_company: !partner.name.includes('Демо,') && !partner.name.startsWith('Дизайнерка'),
    category_id: [[6, 0, [tagIds.get(partner.tag)]]],
    user_id: adminId,
    x_partner_last_contact: daysAgo(partner.daysSinceContact),
  });
}
console.log(`partners: ${DEMO_PARTNERS.length}`);

const [partnerModelId] = await odoo.search('ir.model', [['model', '=', 'res.partner']]);
const [dateFieldId] = await odoo.search('ir.model.fields', [['model', '=', 'res.partner'], ['name', '=', 'x_partner_last_contact']]);

if (partnerModelId === undefined || dateFieldId === undefined) throw new Error('res.partner model or date field not found');

const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', REMIND_NAME]], {
  name: REMIND_NAME,
  model_id: partnerModelId,
  trigger: 'on_time',
  trg_date_id: dateFieldId,
  trg_date_range: CONTACT_INTERVAL_DAYS,
  trg_date_range_type: 'day',
  filter_domain: "[('category_id.name', '=like', 'Партнер:%')]",
});
await ensureRecord(odoo, 'ir.actions.server', [['name', '=', `${REMIND_NAME} (code)`]], {
  name: `${REMIND_NAME} (code)`,
  model_id: partnerModelId,
  state: 'code',
  usage: 'base_automation',
  base_automation_id: automationId,
  code: await readFile('odoo/partners/remind-contact.py', 'utf8'),
});
await ensureRecord(odoo, 'ir.actions.server', [['name', '=', MARK_NAME]], {
  name: MARK_NAME,
  model_id: partnerModelId,
  state: 'code',
  binding_model_id: partnerModelId,
  binding_type: 'action',
  code: await readFile('odoo/partners/mark-contact.py', 'utf8'),
});
console.log(`reminder automation -> ${automationId}`);
