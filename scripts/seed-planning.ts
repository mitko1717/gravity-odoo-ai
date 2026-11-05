import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

// Synthetic crew: roles and employees for the demo, not Gravity's staff.
const CREW: Array<{ role: string; employees: string[] }> = [
  { role: 'Монтажник (демо)', employees: ['Монтажник Андрій (демо)', 'Монтажник Богдан (демо)'] },
  { role: 'Інженер-налагоджувальник (демо)', employees: ['Інженер Віктор (демо)'] },
];
const ACTION_NAME = 'Запланувати бригади';

const odoo = OdooClient.fromEnv();

for (const crew of CREW) {
  const roleId = await ensureRecord(odoo, 'planning.role', [['name', '=', crew.role]], { name: crew.role });
  const resourceIds: number[] = [];

  for (const name of crew.employees) {
    const employeeId = await ensureRecord(odoo, 'hr.employee', [['name', '=', name]], { name, job_title: crew.role });
    const [employee] = await odoo.searchRead<{ resource_id: [number, string] }>('hr.employee', [['id', '=', employeeId]], ['resource_id']);
    if (employee === undefined) throw new Error(`employee not found: ${name}`);

    resourceIds.push(employee.resource_id[0]);
  }

  await odoo.write('planning.role', [roleId], { resource_ids: [[6, 0, resourceIds]] });
  console.log(`${crew.role} -> role ${roleId}, resources ${resourceIds.join(', ')}`);
}

const [modelId] = await odoo.search('ir.model', [['model', '=', 'project.project']]);
if (modelId === undefined) throw new Error('project.project model not found');

const actionId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', ACTION_NAME]], {
  name: ACTION_NAME,
  model_id: modelId,
  state: 'code',
  binding_model_id: modelId,
  binding_type: 'action',
  code: await readFile('odoo/planning/plan-crew.py', 'utf8'),
});
console.log(`planning button -> ${actionId}`);
