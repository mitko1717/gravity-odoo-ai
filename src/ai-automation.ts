import { readFile } from 'node:fs/promises';
import type { OdooClient } from './odoo-client.js';
import { ensureRecord } from './ensure.js';

interface ToolSpec {
  name: string;
  toolName: string;
  description: string;
}

export interface AiActionSpec {
  model: string;
  dir: string;
  actionName: string;
  readTool: ToolSpec;
  applyTool: ToolSpec;
}

export interface AiAutomationSpec extends AiActionSpec {
  automationName: string;
}

interface AiParts {
  modelId: number;
  prompt: string;
  toolIds: number[];
}

const EMPTY_SCHEMA = JSON.stringify({ type: 'object', properties: {}, required: [] });

const readPart = (spec: AiActionSpec, file: string) => readFile(`${spec.dir}/${file}`, 'utf8');

async function ensureAiParts(odoo: OdooClient, spec: AiActionSpec): Promise<AiParts> {
  const [modelId] = await odoo.search('ir.model', [['model', '=', spec.model]]);

  if (modelId === undefined) throw new Error(`model not found: ${spec.model}`);

  const readCode = await readPart(spec, 'read-tool-code.py');
  const applyCode = await readPart(spec, 'tool-code.py');
  const schema = await readPart(spec, 'tool-schema.json');
  const prompt = await readPart(spec, 'prompt.html');

  const toolValues = (tool: ToolSpec, code: string, toolSchema: string) => ({
    name: tool.name,
    model_id: modelId,
    state: 'code',
    code,
    use_in_ai: true,
    ai_tool_name: tool.toolName,
    ai_tool_description: tool.description,
    ai_tool_schema: toolSchema,
  });

  const readId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', spec.readTool.name]], toolValues(spec.readTool, readCode, EMPTY_SCHEMA));
  const applyId = await ensureRecord(odoo, 'ir.actions.server', [['name', '=', spec.applyTool.name]], toolValues(spec.applyTool, applyCode, schema));

  return { modelId, prompt, toolIds: [readId, applyId] };
}

export async function ensureAiAutomation(odoo: OdooClient, spec: AiAutomationSpec): Promise<number> {
  const parts = await ensureAiParts(odoo, spec);
  const automationId = await ensureRecord(odoo, 'base.automation', [['name', '=', spec.automationName]], {
    name: spec.automationName,
    model_id: parts.modelId,
    trigger: 'on_create',
  });

  return ensureRecord(odoo, 'ir.actions.server', [['name', '=', spec.actionName]], {
    name: spec.actionName,
    model_id: parts.modelId,
    state: 'ai',
    usage: 'base_automation',
    base_automation_id: automationId,
    ai_action_prompt: parts.prompt,
    ai_tool_ids: [[6, 0, parts.toolIds]],
  });
}

export async function ensureAiButton(odoo: OdooClient, spec: AiActionSpec): Promise<number> {
  const parts = await ensureAiParts(odoo, spec);

  return ensureRecord(odoo, 'ir.actions.server', [['name', '=', spec.actionName]], {
    name: spec.actionName,
    model_id: parts.modelId,
    state: 'ai',
    binding_model_id: parts.modelId,
    binding_type: 'action',
    ai_action_prompt: parts.prompt,
    ai_tool_ids: [[6, 0, parts.toolIds]],
  });
}
