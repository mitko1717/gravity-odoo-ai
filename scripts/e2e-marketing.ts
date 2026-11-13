import { setTimeout as sleep } from 'node:timers/promises';
import { OdooClient } from '../src/odoo-client.js';
import { CAMPAIGNS, DEMO_LEADS, MARKETING_ARTICLE } from '../src/config/marketing.js';

interface LeadRow {
  id: number;
  name: string;
  x_ai_status: string | false;
  x_ai_priority: string | false;
  campaign_id: [number, string] | false;
}

const odoo = OdooClient.fromEnv();

const campaignRows = await odoo.searchRead<{ id: number; name: string }>('utm.campaign', [['name', 'in', CAMPAIGNS.map((c) => c.key)]], ['name']);
const campaignIds = new Map(campaignRows.map((row) => [row.name, row.id]));
if (campaignIds.size !== CAMPAIGNS.length) throw new Error('run seed:marketing first');

// Idempotent test: remove leads from previous runs of the demo campaigns.
const oldLeadIds = await odoo.call<number[]>('crm.lead', 'search', { domain: [['campaign_id', 'in', [...campaignIds.values()]]], context: { active_test: false } });
if (oldLeadIds.length > 0) await odoo.call('crm.lead', 'unlink', { ids: oldLeadIds });

const created: number[] = [];
for (const [index, [key, name, text]] of DEMO_LEADS.entries()) {
  const spec = CAMPAIGNS.find((campaign) => campaign.key === key);
  const [sourceId] = await odoo.search('utm.source', [['name', '=', spec?.source ?? '']]);
  const [mediumId] = await odoo.search('utm.medium', [['name', '=', spec?.medium ?? '']]);
  const id = await odoo.create('crm.lead', {
    name: 'Website request',
    contact_name: name,
    email_from: `mkt${index + 1}.demo@example.com`,
    description: text,
    campaign_id: campaignIds.get(key),
    source_id: sourceId,
    medium_id: mediumId,
  });
  created.push(id);
}
console.log(`created ${created.length} leads (removed ${oldLeadIds.length} old)`);

let rows: LeadRow[] = [];
for (let attempt = 0; attempt < 36; attempt += 1) {
  rows = await odoo.searchRead<LeadRow>('crm.lead', [['id', 'in', created]], ['name', 'x_ai_status', 'x_ai_priority', 'campaign_id']);
  const pending = rows.filter((row) => !row.x_ai_status || row.x_ai_status === 'pending').length;
  if (pending === 0) break;

  await sleep(5000);
}
for (const row of rows) console.log(`  ${row.campaign_id ? row.campaign_id[1] : '-'} | ${row.x_ai_priority} | ${row.x_ai_status} | ${row.name}`);

const [articleId] = await odoo.search('knowledge.article', [['name', '=', MARKETING_ARTICLE]]);
const [actionId] = await odoo.search('ir.actions.server', [['name', '=', 'AI: marketing report']]);
if (articleId === undefined || actionId === undefined) throw new Error('run seed:marketing first');

await odoo.call('ir.actions.server', 'run', { ids: [actionId], context: { active_id: articleId, active_ids: [articleId], active_model: 'knowledge.article' } });

const [article] = await odoo.searchRead<{ body: string }>('knowledge.article', [['id', '=', articleId]], ['body']);
const text = (article?.body ?? '').replace(/<\/(td|th)>/g, ' | ').replace(/<br\/?>|<\/(p|tr|h2|h3)>/g, '\n').replace(/<[^>]+>/g, '');
console.log(text);
console.log(`open: ${process.env.ODOO_URL}/odoo/knowledge/${articleId}`);
