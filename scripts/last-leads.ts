import { OdooClient } from '../src/odoo-client.js';

// Dev helper: prints the latest leads with AI status and priority.

interface LeadRow {
  id: number;
  name: string;
  type: string;
  user_id: [number, string] | false;
  x_ai_status: string | false;
  x_ai_priority: string | false;
}

const odoo = OdooClient.fromEnv();
const leads = await odoo.call<LeadRow[]>('crm.lead', 'search_read', {
  domain: [],
  fields: ['id', 'name', 'type', 'user_id', 'x_ai_status', 'x_ai_priority'],
  order: 'id desc',
  limit: 5,
  context: { active_test: false },
});

for (const lead of leads) {
  const owner = lead.user_id ? lead.user_id[1] : '—';

  console.log(`#${lead.id} [${lead.type}] ${lead.name} | owner: ${owner} | ai: ${lead.x_ai_status}/${lead.x_ai_priority}`);
}
