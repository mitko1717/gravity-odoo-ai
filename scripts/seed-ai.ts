import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

const DIR = 'odoo/lead-analysis';
const TOOL_NAME = 'Gravity AI Tool: Apply lead analysis';
const AUTOMATION_NAME = 'Gravity: AI-аналіз нової заявки';
const AI_ACTION_NAME = 'Gravity: AI-аналіз ліда';

const odoo = OdooClient.fromEnv();
const [leadModelId] = await odoo.search('ir.model', [['model', '=', 'crm.lead']]);

if (leadModelId === undefined) throw new Error('crm.lead model not found');

const [code, schema, prompt] = await Promise.all([
  readFile(`${DIR}/tool-code.py`, 'utf8'),
  readFile(`${DIR}/tool-schema.json`, 'utf8'),
  readFile(`${DIR}/prompt.html`, 'utf8'),
]);

const toolId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', TOOL_NAME]], {
  name: TOOL_NAME,
  model_id: leadModelId,
  state: 'code',
  code,
  use_in_ai: true,
  ai_tool_name: 'gravity_apply_lead_analysis',
  ai_tool_description: 'Save the structured analysis of the current lead. Call exactly once.',
  ai_tool_schema: schema,
});

console.log(`tool -> ${toolId}`);

const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', AUTOMATION_NAME]], {
  name: AUTOMATION_NAME,
  model_id: leadModelId,
  trigger: 'on_create',
});

console.log(`automation -> ${automationId}`);

const aiActionId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', AI_ACTION_NAME]], {
  name: AI_ACTION_NAME,
  model_id: leadModelId,
  state: 'ai',
  usage: 'base_automation',
  base_automation_id: automationId,
  ai_action_prompt: prompt,
  ai_tool_ids: [[6, 0, [toolId]]],
});

console.log(`ai action -> ${aiActionId}`);
