import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';
import { CONSULTATION_NAME } from '../src/config/appointment.js';

// Public booking page for a first consultation. lead_create stays off: the client books from a link
// sent for an existing lead, so Odoo must not create a second opportunity.
const ADMIN_USER_ID = 2;
const WORKDAYS = ['1', '2', '3', '4', '5'];

const odoo = OdooClient.fromEnv();
const [existingId] = await odoo.search('appointment.type', [['name', '=', CONSULTATION_NAME]]);
const slots = WORKDAYS.map((weekday) => [0, 0, { weekday, start_hour: 10, end_hour: 18 }]);

const values: Record<string, unknown> = {
  name: CONSULTATION_NAME,
  appointment_duration: 1,
  appointment_tz: 'Europe/Kyiv',
  category: 'recurring',
  schedule_based_on: 'users',
  staff_user_ids: [[6, 0, [ADMIN_USER_ID]]],
  min_schedule_hours: 2,
  max_schedule_days: 30,
  lead_create: false,
  is_published: true,
  message_intro: '<p>Free consultation with an engineer: we discuss your property, systems and timeline. Fictional demo company, synthetic data.</p>',
};

// Slots are replaced only on first creation, so manual edits in Odoo survive reruns.
const typeId = existingId === undefined
  ? await odoo.create('appointment.type', { ...values, slot_ids: slots })
  : await ensureRecord(odoo, 'appointment.type', [['id', '=', existingId]], values);

const [row] = await odoo.searchRead<{ website_url: string | false }>('appointment.type', [['id', '=', typeId]], ['website_url']);

console.log(`appointment type ${typeId}: ${process.env.ODOO_URL}${row?.website_url || ''}`);

// Booking → lead link: the client books from the link sent for a lead, the automation finds that lead
// by the booker's contact or email, moves it to «Consultation / site visit» and closes the reminder activity.
const LINK_NAME = 'Opsline: consultation booking → lead';
const [eventModelId] = await odoo.search('ir.model', [['model', '=', 'calendar.event']]);
if (eventModelId === undefined) throw new Error('calendar.event model not found');

const linkAutomationId = await ensureRecord(odoo, 'base.automation', [['name', '=', LINK_NAME]], {
  name: LINK_NAME,
  model_id: eventModelId,
  trigger: 'on_create',
  filter_domain: "[('appointment_type_id', '!=', False)]",
});

await ensureRecord(odoo, 'ir.actions.server', [['name', '=', `${LINK_NAME} (code)`]], {
  name: `${LINK_NAME} (code)`,
  model_id: eventModelId,
  state: 'code',
  usage: 'base_automation',
  base_automation_id: linkAutomationId,
  code: await readFile('odoo/appointment/link-lead.py', 'utf8'),
});

console.log(`booking → lead automation -> ${linkAutomationId}`);
