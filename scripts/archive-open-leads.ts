import { OdooClient } from '../src/odoo-client.js';

// Stops lead reminders (bot digest, Odoo activity e-mails): archives every unfinished lead/opportunity
// (not won, no quotation) and deletes its open activities. Archived leads stay restorable (CRM -> Filters -> Archived).
// Usage: npm run archive:leads        (dry run)
//        npm run archive:leads -- --apply

interface LeadRow {
  id: number;
  name: string;
  create_date: string;
  stage_id: [number, string] | false;
}

const APPLY = process.argv.includes('--apply');
const RECENT_DAYS = 3;

const odoo = OdooClient.fromEnv();

const OPEN_LEADS = [['stage_id.is_won', '=', false], ['order_ids', '=', false]];

const leads = await odoo.searchRead<LeadRow>('crm.lead', OPEN_LEADS, ['id', 'name', 'create_date', 'stage_id']);
const leadIds = leads.map((lead) => lead.id);

const activityIds = leadIds.length > 0
  ? await odoo.search('mail.activity', [['res_model', '=', 'crm.lead'], ['res_id', 'in', leadIds]])
  : [];

const since = new Date(Date.now() - RECENT_DAYS * 24 * 3600 * 1000).toISOString().slice(0, 10);
const recent = leads.filter((lead) => lead.create_date >= since);

console.log(`open leads: ${leads.length} (created in last ${RECENT_DAYS} days: ${recent.length})`);
console.log(`open activities on them: ${activityIds.length}`);

for (const lead of recent.slice(0, 10)) {
  const stage = lead.stage_id ? lead.stage_id[1] : '-';
  console.log(`  recent: ${lead.create_date.slice(0, 16)} · ${stage} · ${lead.name.slice(0, 60)}`);
}

if (!APPLY) {
  console.log('dry run: add -- --apply to write');
  process.exit(0);
}

if (activityIds.length > 0) await odoo.call('mail.activity', 'unlink', { ids: activityIds });
console.log(`activities deleted: ${activityIds.length}`);

if (leadIds.length > 0) await odoo.write('crm.lead', leadIds, { active: false });
console.log(`leads archived: ${leadIds.length}`);
