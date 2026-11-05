import { OdooClient } from '../src/odoo-client.js';

type Fields = Record<string, { string: string; type: string; selection?: Array<[string, string]> }>;

const odoo = OdooClient.fromEnv();
const show = async (model: string, needles: string[]): Promise<void> => {
  const fields = await odoo.call<Fields>(model, 'fields_get', { attributes: ['string', 'type', 'selection'] });
  const matches = Object.entries(fields).filter(([name]) => needles.some((needle) => name.includes(needle)));

  for (const [name, meta] of matches) console.log(`${model}.${name}: ${meta.type} "${meta.string}" ${meta.selection ? JSON.stringify(meta.selection) : ''}`);
};

await show('res.config.settings', ['template', 'depend', 'milestone']);
await show('product.template', ['service_tracking', 'project']);
await show('project.project', ['template', 'depend']);
await show('project.task', ['depend']);
