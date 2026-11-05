import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord } from '../src/ensure.js';
import { AI_FIELDS, FORM_FIELDS } from '../src/config/lead-fields.js';

const STAGES = [
  { id: 1, name: 'Нова заявка', sequence: 1 },
  { id: 2, name: 'Кваліфікована', sequence: 2 },
  { id: null, name: 'Консультація / виїзд', sequence: 3 },
  { id: 3, name: 'Комерційна пропозиція', sequence: 4 },
  { id: 4, name: 'Договір підписано', sequence: 5 },
];

const TAGS = [
  'Розумний дім',
  'Електромонтаж',
  'Інженерні системи',
  'Теплові насоси',
  'Сервіс',
  'B2B / ЖК',
  'Партнерський канал',
  'AI: потрібна перевірка',
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
