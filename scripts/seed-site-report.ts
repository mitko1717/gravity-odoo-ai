import { OdooClient } from '../src/odoo-client.js';
import { ensureAiButton } from '../src/ai-automation.js';

// «AI: звіт по об’єкту» button on projects (rules compute status, AI writes the text).

const odoo = OdooClient.fromEnv();

const actionId = await ensureAiButton(odoo, {
  model: 'project.project',
  dir: 'odoo/site-report',
  actionName: 'AI: звіт по об’єкту',
  readTool: { name: 'Opsline AI Tool: Get site data', toolName: 'opsline_get_site_data', description: 'Return tasks, stages, deadlines and notes of the current project. Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply site report', toolName: 'opsline_apply_site_report', description: 'Save the site status report as a project update. Call exactly once.' },
});
console.log(`site report AI button -> ${actionId}`);
