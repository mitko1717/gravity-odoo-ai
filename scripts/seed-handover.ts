import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';
import { ensureAiButton } from '../src/ai-automation.js';

// Commissioning checklist AI, handover email AI and the «tests passed → handover» gate automation.

const GATE_NAME = 'Opsline: tests passed → client handover';

const odoo = OdooClient.fromEnv();

const commissioningId = await ensureAiButton(odoo, {
  model: 'project.task',
  dir: 'odoo/commissioning',
  actionName: 'AI: commissioning protocol',
  readTool: { name: 'Opsline AI Tool: Get commissioning inputs', toolName: 'opsline_get_commissioning_inputs', description: 'Return the approved specification and requested services. Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply commissioning', toolName: 'opsline_apply_commissioning', description: 'Create the checklist as sub-tasks. Call exactly once.' },
});
console.log(`commissioning AI button -> ${commissioningId}`);

const handoverId = await ensureAiButton(odoo, {
  model: 'project.project',
  dir: 'odoo/handover',
  actionName: 'AI: handover email to client',
  readTool: { name: 'Opsline AI Tool: Get handover inputs', toolName: 'opsline_get_handover_inputs', description: 'Return installed equipment, completed checks and warranty terms. Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply handover draft', toolName: 'opsline_apply_handover_draft', description: 'Save the client email draft into the handover task. Call exactly once.' },
});
console.log(`handover AI button -> ${handoverId}`);

const [taskModelId] = await odoo.search('ir.model', [['model', '=', 'project.task']]);
if (taskModelId === undefined) throw new Error('project.task model not found');

const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', GATE_NAME]], {
  name: GATE_NAME,
  model_id: taskModelId,
  trigger: 'on_stage_set',
  filter_domain: "[('name', '=', 'System testing'), ('stage_id.name', '=', 'Done'), ('project_id.is_template', '=', False)]",
});

await ensureRecord(odoo, 'ir.actions.server', [['name', '=', `${GATE_NAME} (code)`]], {
  name: `${GATE_NAME} (code)`,
  model_id: taskModelId,
  state: 'code',
  usage: 'base_automation',
  base_automation_id: automationId,
  code: await readFile('odoo/handover/tests-done.py', 'utf8'),
});
console.log(`handover gate -> ${automationId}`);
