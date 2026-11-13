import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord, type FieldSpec } from '../src/ensure.js';
import { ensureAiButton } from '../src/ai-automation.js';

// Meetings: transcript and summary fields on projects and the «AI: process meeting» action.

const PROJECT_FIELDS: FieldSpec[] = [
  { name: 'x_meeting_transcript', label: 'Meeting transcript (for AI)', type: 'text' },
  { name: 'x_meeting_summary', label: 'AI: meeting summary', type: 'text' },
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
  arch_db: `<xpath expr="//notebook" position="inside"><page string="Meetings / AI" name="gravity_meeting"><group>${fieldsXml}</group></page></xpath>`,
});

const projectId = await ensureRecord(odoo, 'project.project', [['name', '=', 'Meetings: project planning (demo)']], {
  name: 'Meetings: project planning (demo)',
});
await ensureRecord(odoo, 'project.task.type', [['name', '=', 'Meeting drafts']], {
  name: 'Meeting drafts',
  sequence: 0,
  project_ids: [[6, 0, [projectId]]],
});
await ensureRecord(odoo, 'project.tags', [['name', '=', 'AI draft']], { name: 'AI draft' });
console.log(`meetings project -> ${projectId}`);

const actionId = await ensureAiButton(odoo, {
  model: 'project.project',
  dir: 'odoo/meeting-analysis',
  actionName: 'AI: process meeting',
  readTool: { name: 'Opsline AI Tool: Get meeting data', toolName: 'opsline_get_meeting_data', description: 'Return the meeting transcript of the current project (untrusted input). Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply meeting analysis', toolName: 'opsline_apply_meeting_analysis', description: 'Save the summary and create draft tasks. Call exactly once.' },
});
console.log(`meeting AI button -> ${actionId}`);
