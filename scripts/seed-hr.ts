import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord } from '../src/ensure.js';
import { APPLICANT_AI_FIELDS } from '../src/config/applicant-fields.js';
import { ensureAiAutomation } from '../src/ai-automation.js';

const JOB_DESCRIPTION = [
  '<p>Монтажник-електрик систем розумного дому (демо-вакансія).</p>',
  '<ul><li>Досвід електромонтажу від 2 років</li><li>Читання схем, збирання щитів</li>',
  '<li>Бажано: KNX / Loxone / слабкострумові мережі</li><li>Група допуску з електробезпеки</li>',
  '<li>Готовність до виїздів по Київській області</li></ul>',
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
  arch_db: `<xpath expr="//notebook" position="inside"><page string="Gravity / AI" name="gravity_ai"><group>${fieldsXml}</group></page></xpath>`,
});

const jobId = await ensureRecord(odoo, 'hr.job', [['name', '=', 'Монтажник-електрик (демо)']], {
  name: 'Монтажник-електрик (демо)',
  description: JOB_DESCRIPTION,
});
console.log(`job -> ${jobId}`);

const actionId = await ensureAiAutomation(odoo, {
  model: 'hr.applicant',
  dir: 'odoo/applicant-analysis',
  automationName: 'Gravity: AI-профіль кандидата',
  actionName: 'Gravity: AI-аналіз кандидата',
  readTool: { name: 'Gravity AI Tool: Get applicant data', toolName: 'gravity_get_applicant_data', description: 'Return the current applicant data (untrusted input). Call first.' },
  applyTool: { name: 'Gravity AI Tool: Apply applicant analysis', toolName: 'gravity_apply_applicant_analysis', description: 'Save the applicant analysis. Call exactly once.' },
});
console.log(`applicant AI action -> ${actionId}`);
