import { readFile } from 'node:fs/promises';
import type { OdooClient } from './odoo-client.js';
import { ensureRecord } from './ensure.js';

export interface AiAutomationSpec {
  model: string;
  dir: string;
  automationName: string;
  actionName: string;
  readTool: { name: string; toolName: string; description: string };
  applyTool: { name: string; toolName: string; description: string };
}

export async function ensureAiAutomation(odoo: OdooClient, spec: AiAutomationSpec): Promise<number> {
  const [modelId] = await odoo.search('ir.model', [['model', '=', spec.model]]);

  if (modelId === undefined) throw new Error(`model not found: ${spec.model}`);

  const [readCode, applyCode, schema, prompt] = await Promise.all(
    ['read-tool-code.py', 'tool-code.py', 'tool-schema.json', 'prompt.html'].map((file) => readFile(`${spec.dir}/${file}`, 'utf8')),
  );

  const toolValues = (tool: AiAutomationSpec['readTool'], code: string | undefined, toolSchema: string) => ({
    name: tool.name,
    model_id: modelId,
    state: 'code',
    code,
    use_in_ai: true,
    ai_tool_name: tool.toolName,
    ai_tool_description: tool.description,
    ai_tool_schema: toolSchema,
  });

  const emptySchema = JSON.stringify({ type: 'object', properties: {}, required: [] });
  const readId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', spec.readTool.name]], toolValues(spec.readTool, readCode, emptySchema));
  const applyId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', spec.applyTool.name]], toolValues(spec.applyTool, applyCode, schema ?? ''));
  const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', spec.automationName]], {
    name: spec.automationName,
    model_id: modelId,
    trigger: 'on_create',
  });

  return ensureRecord(odoo, 'ir.actions.server', [['name', '=', spec.actionName]], {
    name: spec.actionName,
    model_id: modelId,
    state: 'ai',
    usage: 'base_automation',
    base_automation_id: automationId,
    ai_action_prompt: prompt,
    ai_tool_ids: [[6, 0, [readId, applyId]]],
  });
}
