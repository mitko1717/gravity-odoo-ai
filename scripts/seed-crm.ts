import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord } from '../src/ensure.js';
import { AI_FIELDS, FORM_FIELDS } from '../src/config/lead-fields.js';

// CRM pipeline stages in Ukrainian (New request → … → Contract signed) and custom lead fields (form + AI).

const STAGES = [
  { id: 1, name: 'New request', sequence: 1 },
  { id: 2, name: 'Qualified', sequence: 2 },
  { id: null, name: 'Consultation / site visit', sequence: 3 },
  { id: 3, name: 'Quotation', sequence: 4 },
  { id: 4, name: 'Contract signed', sequence: 5 },
];

const TAGS = [
  'Smart home',
  'Electrical installation',
  'Engineering systems',
  'Heat pumps',
  'Service',
  'B2B / residential complex',
  'Partner channel',
  'AI: needs review',
];

const odoo = OdooClient.fromEnv();

for (const stage of STAGES) {
  const values = { name: stage.name, sequence: stage.sequence };

  if (stage.id !== null) {
    await odoo.write('crm.stage', [stage.id], values);
    continue;
  }

  await ensureRecord(odoo, 'crm.stage', [['name', '=', stage.name]], values);
}

console.log(`stages: ${STAGES.length}`);

for (const tag of TAGS) {
  await ensureRecord(odoo, 'crm.tag', [['name', '=', tag]], { name: tag });
}

console.log(`tags: ${TAGS.length}`);

for (const field of [...FORM_FIELDS, ...AI_FIELDS]) {
  const id = await ensureField(odoo, 'crm.lead', field);

  console.log(`field ${field.name} -> ${id}`);
}
