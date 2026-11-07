import { OdooClient } from '../src/odoo-client.js';

// Dev helper: lists server action types, automation triggers and AI-related fields of this Odoo version.

type FieldsGet = Record<string, { string: string; type: string; selection?: Array<[string, string]> }>;

const odoo = OdooClient.fromEnv();
const actionFields = await odoo.call<FieldsGet>('ir.actions.server', 'fields_get', { attributes: ['string', 'type', 'selection'] });
const triggerFields = await odoo.call<FieldsGet>('base.automation', 'fields_get', { attributes: ['string', 'type', 'selection'] });

console.log('action types:', actionFields.state?.selection);
console.log('triggers:', triggerFields.trigger?.selection);

const aiRelated = Object.entries(actionFields).filter(([name]) => name.includes('ai') || name.includes('prompt'));

for (const [name, meta] of aiRelated) console.log(`action field ${name}: ${meta.type} "${meta.string}"`);
