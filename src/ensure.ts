import type { OdooClient } from './odoo-client.js';

export async function ensureRecord(
  odoo: OdooClient,
  model: string,
  domain: unknown[],
  values: Record<string, unknown>,
): Promise<number> {
  const [existingId] = await odoo.search(model, domain);

  if (existingId !== undefined) {
    await odoo.write(model, [existingId], values);

    return existingId;
  }

  return odoo.create(model, values);
}

export interface FieldSpec {
  name: `x_${string}`;
  label: string;
  type: 'char' | 'text' | 'float' | 'integer' | 'selection' | 'boolean' | 'date';
  options?: Array<[value: string, label: string]>;
}

export async function ensureField(odoo: OdooClient, model: string, spec: FieldSpec): Promise<number> {
  const [modelId] = await odoo.search('ir.model', [['model', '=', model]]);

  if (modelId === undefined) throw new Error(`Model not found: ${model}`);

  const [existingId] = await odoo.search('ir.model.fields', [
    ['model', '=', model],
    ['name', '=', spec.name],
  ]);

  if (existingId !== undefined) {
    return existingId;
  }

  const selectionCommands = (spec.options ?? []).map(([value, label], index) => [
    0,
    0,
    { value, name: label, sequence: index },
  ]);

  return odoo.create('ir.model.fields', {
    model_id: modelId,
    name: spec.name,
    field_description: spec.label,
    ttype: spec.type,
    state: 'manual',
    store: true,
    ...(spec.type === 'selection' ? { selection_ids: selectionCommands } : {}),
  });
}
