import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord } from '../src/ensure.js';
import { APPLICANT_AI_FIELDS } from '../src/config/applicant-fields.js';
import { ensureAiAutomation, ensureAiButton } from '../src/ai-automation.js';

// Recruitment: demo job, AI fields on applicants, form tab and the applicant analysis AI.

const JOB_DESCRIPTION = [
  '<p>Electrician installer for smart home systems (demo vacancy).</p>',
  '<ul><li>2+ years of electrical installation</li><li>Reading diagrams, assembling switchboards</li>',
  '<li>Nice to have: KNX / Loxone / low-voltage networks</li><li>Electrical safety qualification</li>',
  '<li>Ready to travel across the Kyiv region</li></ul>',
].join('');

const odoo = OdooClient.fromEnv();

for (const field of APPLICANT_AI_FIELDS) await ensureField(odoo, 'hr.applicant', field);
console.log(`applicant fields: ${APPLICANT_AI_FIELDS.length}`);

const [baseView] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'hr_recruitment'], ['name', '=', 'hr_applicant_view_form']], ['res_id']);
if (!baseView) throw new Error('hr.applicant form view not found');

const fieldsXml = APPLICANT_AI_FIELDS.map((field) => `<field name="${field.name}"/>`).join('');
await ensureRecord(odoo, 'ir.ui.view', [['name', '=', 'hr.applicant.form.gravity.ai']], {
  name: 'hr.applicant.form.gravity.ai',
  model: 'hr.applicant',
  type: 'form',
  inherit_id: baseView.res_id,
  arch_db: `<xpath expr="//notebook" position="inside"><page string="Opsline / AI" name="gravity_ai"><group>${fieldsXml}</group></page></xpath>`,
});

const jobId = await ensureRecord(odoo, 'hr.job', [['name', '=', 'Electrician installer (demo)']], {
  name: 'Electrician installer (demo)',
  description: JOB_DESCRIPTION,
});
console.log(`job -> ${jobId}`);

const actionId = await ensureAiAutomation(odoo, {
  model: 'hr.applicant',
  dir: 'odoo/applicant-analysis',
  automationName: 'Opsline: AI applicant profile',
  actionName: 'Opsline: AI applicant analysis',
  readTool: { name: 'Opsline AI Tool: Get applicant data', toolName: 'opsline_get_applicant_data', description: 'Return the current applicant data (untrusted input). Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply applicant analysis', toolName: 'opsline_apply_applicant_analysis', description: 'Save the applicant analysis. Call exactly once.' },
});
console.log(`applicant AI action -> ${actionId}`);

// Manual re-run from the list view (⚙ Actions): website job forms post the introduction after the on-create run.
const buttonId = await ensureAiButton(odoo, {
  model: 'hr.applicant',
  dir: 'odoo/applicant-analysis',
  actionName: 'Opsline: AI applicant analysis (re-run)',
  readTool: { name: 'Opsline AI Tool: Get applicant data', toolName: 'opsline_get_applicant_data', description: 'Return the current applicant data (untrusted input). Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply applicant analysis', toolName: 'opsline_apply_applicant_analysis', description: 'Save the applicant analysis. Call exactly once.' },
});
console.log(`applicant AI button -> ${buttonId}`);
