import { OdooClient } from '../src/odoo-client.js';

// Quick health check: which key modules are installed and which CRM stages exist.

const odoo = OdooClient.fromEnv();
const modules = await odoo.searchRead<{ name: string }>(
  'ir.module.module',
  [['name', 'in', ['base_automation', 'web_studio', 'ai_fields', 'ai_server_actions', 'website_crm']], ['state', '=', 'installed']],
  ['name'],
);
const stages = await odoo.searchRead<{ id: number; name: string }>('crm.stage', [], ['id', 'name']);

console.log('installed:', modules.map((m) => m.name).sort().join(', '));
console.log('crm stages:', stages.map((s) => `${s.id}:${s.name}`).join(', '));
