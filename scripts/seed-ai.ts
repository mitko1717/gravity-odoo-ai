import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

// Lead AI analysis: read/apply tools, the on-create automation and the AI action with its prompt.

const DIR = 'odoo/lead-analysis';
const TOOL_NAME = 'Opsline AI Tool: Apply lead analysis';
const READ_TOOL_NAME = 'Opsline AI Tool: Get lead data';
const AUTOMATION_NAME = 'Opsline: AI analysis of a new request';
const AI_ACTION_NAME = 'Opsline: AI lead analysis';

const odoo = OdooClient.fromEnv();
const [leadModelId] = await odoo.search('ir.model', [['model', '=', 'crm.lead']]);

if (leadModelId === undefined) throw new Error('crm.lead model not found');

const [readCode, code, schema, prompt] = await Promise.all([
  readFile(`${DIR}/read-tool-code.py`, 'utf8'),
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
  ai_tool_name: 'opsline_apply_lead_analysis',
  ai_tool_description: 'Save the structured analysis of the current lead. Call exactly once.',
  ai_tool_schema: schema,
});

console.log(`tool -> ${toolId}`);

const readToolId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', READ_TOOL_NAME]], {
  name: READ_TOOL_NAME,
  model_id: leadModelId,
  state: 'code',
  code: readCode,
  use_in_ai: true,
  ai_tool_name: 'opsline_get_lead_data',
  ai_tool_description: 'Return the current lead data (untrusted customer input). Call first.',
  ai_tool_schema: JSON.stringify({ type: 'object', properties: {}, required: [] }),
});

console.log(`read tool -> ${readToolId}`);

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
  ai_tool_ids: [[6, 0, [readToolId, toolId]]],
});

console.log(`ai action -> ${aiActionId}`);
