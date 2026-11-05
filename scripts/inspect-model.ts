import { OdooClient } from '../src/odoo-client.js';

type Fields = Record<string, { string: string; type: string; required?: boolean; selection?: Array<[string, string]> }>;

const [model, needle = ''] = process.argv.slice(2);
if (!model) throw new Error('usage: npm run inspect -- <model> [needle]');

const odoo = OdooClient.fromEnv();
const fields = await odoo.call<Fields>(model, 'fields_get', { attributes: ['string', 'type', 'required', 'selection'] });

for (const [name, meta] of Object.entries(fields)) {
  if (!name.includes(needle) || ['create_', 'write_', '__'].some((prefix) => name.startsWith(prefix))) continue;

  const selection = meta.selection ? ` ${JSON.stringify(meta.selection)}` : '';

  console.log(`${name}: ${meta.type}${meta.required ? ' REQUIRED' : ''} "${meta.string}"${selection}`);
}
