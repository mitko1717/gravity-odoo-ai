import { OdooClient } from '../src/odoo-client.js';

interface ToolAction {
  id: number;
  name: string;
  state: string;
  model_name: string;
  ai_tool_name: string | false;
  ai_tool_schema: string | false;
  code: string | false;
}

const odoo = OdooClient.fromEnv();
const tools = await odoo.searchRead<ToolAction>(
  'ir.actions.server',
  [['use_in_ai', '=', true]],
  ['id', 'name', 'state', 'model_name', 'ai_tool_name', 'ai_tool_schema', 'code'],
  3,
);

for (const tool of tools) {
  console.log(`--- ${tool.id} ${tool.name} [${tool.state}] on ${tool.model_name} tool=${tool.ai_tool_name}`);
  console.log('schema:', tool.ai_tool_schema);
  console.log('code:', String(tool.code).slice(0, 700));
}

const helps = await odoo.call<Record<string, { help?: string }>>('ir.actions.server', 'fields_get', {
  allfields: ['ai_tool_schema', 'ai_action_prompt', 'ai_tool_ids', 'code'],
  attributes: ['help'],
});

for (const [name, meta] of Object.entries(helps)) console.log(`help ${name}:`, meta.help);
