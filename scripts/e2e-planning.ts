import { OdooClient } from '../src/odoo-client.js';

interface SlotRow {
  name: string;
  role_id: [number, string] | false;
  resource_ids: number[];
  start_datetime: string;
  end_datetime: string;
  state: string;
  overlap_slot_count: number;
}

const odoo = OdooClient.fromEnv();

const [project] = await odoo.call<Array<{ id: number; name: string }>>('project.project', 'search_read', {
  domain: [['sale_order_id', '!=', false], ['is_template', '=', false]],
  fields: ['name'],
  order: 'id desc',
  limit: 1,
});
if (project === undefined) throw new Error('no implementation project, run e2e:project first');

const [actionId] = await odoo.search('ir.actions.server', [['name', '=', 'Запланувати бригади']]);
if (actionId === undefined) throw new Error('run seed:planning first');

const context = { active_id: project.id, active_ids: [project.id], active_model: 'project.project' };
await odoo.call('ir.actions.server', 'run', { ids: [actionId], context });
await odoo.call('ir.actions.server', 'run', { ids: [actionId], context });

const slots = await odoo.call<SlotRow[]>('planning.slot', 'search_read', {
  domain: [['name', 'like', `${project.name} — `]],
  fields: ['name', 'role_id', 'resource_ids', 'start_datetime', 'end_datetime', 'state', 'overlap_slot_count'],
  order: 'start_datetime',
});

console.log(`project ${project.id} «${project.name}»: ${slots.length} shifts (action run twice, expect no duplicates)`);

for (const slot of slots) {
  const role = slot.role_id ? slot.role_id[1] : '-';
  const period = `${slot.start_datetime.slice(0, 10)} → ${slot.end_datetime.slice(0, 10)}`;

  console.log(`  ${period} | ${slot.state} | ${role} x${slot.resource_ids.length} | overlaps ${slot.overlap_slot_count} | ${slot.name.split(' — ')[1]}`);
}
