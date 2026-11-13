import { OdooClient } from '../src/odoo-client.js';

// E2E: commissioning checklist → gate blocks handover while checks are open → AI handover email draft.

interface TaskRow {
  id: number;
  name: string;
  stage_id: [number, string];
  description: string | false;
}

const odoo = OdooClient.fromEnv();
const html = (value: string | false) => String(value || '').replace(/<\/p>|<br\/?>/g, '\n').replace(/<[^>]+>/g, '').trim();

const [project] = await odoo.call<Array<{ id: number; name: string }>>('project.project', 'search_read', {
  domain: [['sale_order_id', '!=', false], ['is_template', '=', false], ['x_spec_lines', '!=', false]],
  fields: ['name'],
  order: 'id desc',
  limit: 1,
});
if (project === undefined) throw new Error('no project with a specification, run e2e:spec first');

const findTask = async (name: string) => {
  const [task] = await odoo.searchRead<TaskRow>('project.task', [['project_id', '=', project.id], ['name', '=', name]], ['name', 'stage_id', 'description']);
  if (task === undefined) throw new Error(`task not found: ${name}`);

  return task;
};
const runAction = async (name: string, model: string, id: number) => {
  const [actionId] = await odoo.search('ir.actions.server', [['name', '=', name]]);
  if (actionId === undefined) throw new Error(`run seed:handover first (${name})`);

  const startedAt = Date.now();
  await odoo.call('ir.actions.server', 'run', { ids: [actionId], context: { active_id: id, active_ids: [id], active_model: model } });

  return ((Date.now() - startedAt) / 1000).toFixed(1);
};

const testTask = await findTask('System testing');
const checklistSeconds = await runAction('AI: commissioning protocol', 'project.task', testTask.id);
const checks = await odoo.searchRead<{ id: number; name: string }>('project.task', [['parent_id', '=', testTask.id]], ['name']);
console.log(`project ${project.id}: checklist ${checks.length} checks, AI ${checklistSeconds} s`);
for (const check of checks) console.log(`  - ${check.name}`);

const [doneStageId] = await odoo.search('project.task.type', [['name', '=', 'Done'], ['project_ids', 'in', [project.id]]]);
if (doneStageId === undefined) throw new Error('stage «Done» not found');

await odoo.write('project.task', [testTask.id], { stage_id: doneStageId });
await odoo.write('project.task', [testTask.id], { stage_id: testTask.stage_id[0] });
await odoo.write('project.task', checks.map((check) => check.id), { state: '1_done' });
await odoo.write('project.task', [testTask.id], { stage_id: doneStageId });

const notes = await odoo.call<Array<{ body: string }>>('mail.message', 'search_read', {
  domain: [['model', '=', 'project.task'], ['res_id', '=', testTask.id], ['body', 'ilike', 'check']],
  fields: ['body'],
  order: 'id desc',
  limit: 3,
});
console.log('gate notes (newest first):', notes.map((note) => html(note.body)));

const handoverTask = await findTask('Handover and client training');
const activities = await odoo.searchRead<{ summary: string }>('mail.activity', [['res_model', '=', 'project.task'], ['res_id', '=', handoverTask.id]], ['summary']);
console.log('handover activities:', activities.map((activity) => activity.summary));

const emailSeconds = await runAction('AI: handover email to client', 'project.project', project.id);
const updated = await findTask('Handover and client training');
console.log(`handover email draft, AI ${emailSeconds} s:\n${html(updated.description)}`);
