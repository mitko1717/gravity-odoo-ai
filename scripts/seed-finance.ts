import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';
import { ensureAiButton } from '../src/ai-automation.js';

export const EXPENSE_MODEL = 'x_gravity_expense';
export const REPORT_ARTICLE = 'Управлінський звіт по об’єктах (демо)';

const FIELDS = [
  { name: 'x_project_id', field_description: 'Проєкт', ttype: 'many2one', relation: 'project.project' },
  { name: 'x_date', field_description: 'Дата', ttype: 'date' },
  { name: 'x_category', field_description: 'Категорія', ttype: 'char' },
  { name: 'x_amount', field_description: 'Сума, грн', ttype: 'float' },
  { name: 'x_source', field_description: 'Джерело (файл)', ttype: 'char' },
];

const odoo = OdooClient.fromEnv();

const modelId = await ensureRecord(odoo, 'ir.model', [['model', '=', EXPENSE_MODEL]], {
  name: 'Opsline: витрати по об’єктах (демо)',
  model: EXPENSE_MODEL,
});
for (const field of FIELDS) {
  await ensureRecord(odoo, 'ir.model.fields', [['model_id', '=', modelId], ['name', '=', field.name]], { ...field, model_id: modelId });
}

const [userGroup] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'base'], ['name', '=', 'group_user']], ['res_id']);
if (!userGroup) throw new Error('base.group_user not found');

// Odoo 20 replaced ir.model.access with ir.access (one operation code instead of four flags).
await ensureRecord(odoo, 'ir.access', [['name', '=', 'access_x_gravity_expense_user']], {
  name: 'access_x_gravity_expense_user',
  model_id: modelId,
  group_id: userGroup.res_id,
  operation: 'crud',
  kind: 'permission',
});
console.log(`expense model -> ${modelId}, fields: ${FIELDS.length}`);

const articleId = await ensureRecord(odoo, 'knowledge.article', [['name', '=', REPORT_ARTICLE]], {
  name: REPORT_ARTICLE,
  internal_permission: 'write',
});
const actionId = await ensureAiButton(odoo, {
  model: 'knowledge.article',
  dir: 'odoo/finance-report',
  actionName: 'AI: управлінський звіт',
  readTool: { name: 'Opsline AI Tool: Get finance data', toolName: 'opsline_get_finance_data', description: 'Return revenue, purchases, expenses and margin per project. Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply finance report', toolName: 'opsline_apply_finance_report', description: 'Write the management report into the current article. Call exactly once.' },
});
console.log(`report article -> ${articleId}, AI button -> ${actionId}`);
