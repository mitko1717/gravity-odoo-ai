import { OdooClient } from '../src/odoo-client.js';
import { ensureField } from '../src/ensure.js';
import { ensureAiButton } from '../src/ai-automation.js';

// Specification field on projects and the «AI: draft specification» button (catalog items only).

const odoo = OdooClient.fromEnv();

await ensureField(odoo, 'project.project', { name: 'x_spec_lines', label: 'Specification (product_id;qty)', type: 'text' });

const actionId = await ensureAiButton(odoo, {
  model: 'project.project',
  dir: 'odoo/spec-draft',
  actionName: 'AI: draft specification',
  readTool: { name: 'Opsline AI Tool: Get spec inputs', toolName: 'opsline_get_spec_inputs', description: 'Return client data from the lead and the equipment catalog. Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply spec draft', toolName: 'opsline_apply_spec_draft', description: 'Validate and save the draft equipment specification. Call exactly once.' },
});
console.log(`spec draft AI button -> ${actionId}`);
