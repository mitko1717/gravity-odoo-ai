import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord, type FieldSpec } from '../src/ensure.js';
import { ensureAiButton } from '../src/ai-automation.js';

const PROJECT_FIELDS: FieldSpec[] = [
  { name: 'x_meeting_transcript', label: 'Транскрипція наради (для AI)', type: 'text' },
  { name: 'x_meeting_summary', label: 'AI: підсумок наради', type: 'text' },
];

const odoo = OdooClient.fromEnv();

for (const field of PROJECT_FIELDS) await ensureField(odoo, 'project.project', field);

const [baseView] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'project'], ['name', '=', 'edit_project']], ['res_id']);

if (!baseView) throw new Error('project form view not found');

const fieldsXml = PROJECT_FIELDS.map((field) => `<field name="${field.name}"/>`).join('');
await ensureRecord(odoo, 'ir.ui.view', [['name', '=', 'project.project.form.gravity.meeting']], {
  name: 'project.project.form.gravity.meeting',
  model: 'project.project',
  type: 'form',
  inherit_id: baseView.res_id,
  arch_db: `<xpath expr="//notebook" position="inside"><page string="Наради / AI" name="gravity_meeting"><group>${fieldsXml}</group></page></xpath>`,
});

const projectId = await ensureRecord(odoo, 'project.project', [['name', '=', 'Наради: планування об’єктів (демо)']], {
  name: 'Наради: планування об’єктів (демо)',
});
await ensureRecord(odoo, 'project.task.type', [['name', '=', 'Чернетки з зустрічей']], {
  name: 'Чернетки з зустрічей',
  sequence: 0,
  project_ids: [[6, 0, [projectId]]],
});
await ensureRecord(odoo, 'project.tags', [['name', '=', 'AI-чернетка']], { name: 'AI-чернетка' });
console.log(`meetings project -> ${projectId}`);

const actionId = await ensureAiButton(odoo, {
  model: 'project.project',
  dir: 'odoo/meeting-analysis',
  actionName: 'AI: розібрати нараду',
  readTool: { name: 'Gravity AI Tool: Get meeting data', toolName: 'gravity_get_meeting_data', description: 'Return the meeting transcript of the current project (untrusted input). Call first.' },
  applyTool: { name: 'Gravity AI Tool: Apply meeting analysis', toolName: 'gravity_apply_meeting_analysis', description: 'Save the summary and create draft tasks. Call exactly once.' },
});
console.log(`meeting AI button -> ${actionId}`);
