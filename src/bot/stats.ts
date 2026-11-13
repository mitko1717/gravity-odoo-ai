import { InlineKeyboard } from 'grammy';
import type { OdooClient } from '../odoo-client.js';
import { escapeHtml } from './format.js';
import { slaOnTime } from './sla.js';

// All numbers are computed by plain queries; no AI in statistics.
const odooNow = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 19).replace('T', ' ');
const count = (odoo: OdooClient, model: string, domain: unknown[]) => odoo.call<number>(model, 'search_count', { domain });

export const STATS_KEYBOARD = new InlineKeyboard()
  .text('📥 Leads', 'stats:leads')
  .text('📣 Campaigns', 'stats:campaigns')
  .row()
  .text('⏰ Overdue', 'stats:overdue')
  .text('🛠 Service', 'stats:service')
  .row()
  .text('💰 Funnel', 'stats:pipeline');

async function leadsStats(odoo: OdooClient): Promise<string> {
  const since = daysAgo(7);
  const lines = ['📥 <b>Leads, last 7 days</b> (priority is an AI recommendation)'];
  for (const [value, label] of [['high', '🔴 high'], ['medium', '🟡 medium'], ['low', '⚪ low']]) {
    lines.push(`${label}: ${await count(odoo, 'crm.lead', [['create_date', '>=', since], ['x_ai_priority', '=', value]])}`);
  }
  lines.push(`Need review: ${await count(odoo, 'crm.lead', [['create_date', '>=', since], ['x_ai_status', '=', 'needs_review']])}`);
  lines.push(`No manager: ${await count(odoo, 'crm.lead', [['create_date', '>=', since], ['user_id', '=', false]])}`);

  return lines.join('\n');
}

async function campaignsStats(odoo: OdooClient): Promise<string> {
  // `title` is the human label in recent Odoo versions; `name` is the technical UTM code.
  const campaigns = await odoo.searchRead<{ id: number; name: string; title: string | false; x_ad_spend: number }>('utm.campaign', [['x_ad_spend', '>', 0]], ['name', 'title', 'x_ad_spend']);
  const lines = ['📣 <b>Campaigns</b> (qualified = AI priority high/medium)'];
  for (const campaign of campaigns) {
    const leads = await count(odoo, 'crm.lead', [['campaign_id', '=', campaign.id]]);
    const qualified = await count(odoo, 'crm.lead', [['campaign_id', '=', campaign.id], ['x_ai_priority', 'in', ['high', 'medium']]]);
    const perQualified = qualified ? Math.round(campaign.x_ad_spend / qualified) : '—';
    lines.push(`${escapeHtml(campaign.title || campaign.name)}: ${leads} leads, ${qualified} qualified, UAH ${perQualified} per qualified lead`);
  }

  return lines.join('\n');
}

async function overdueStats(odoo: OdooClient): Promise<string> {
  const domain = [['date_deadline', '<', odooNow()], ['parent_id', '=', false], ['project_id.is_template', '=', false], ['stage_id.name', '!=', 'Done']];
  const tasks = await odoo.call<Array<{ name: string; project_id: [number, string]; date_deadline: string }>>('project.task', 'search_read', {
    domain,
    fields: ['name', 'project_id', 'date_deadline'],
    order: 'date_deadline',
    limit: 10,
  });
  const total = await count(odoo, 'project.task', domain);
  const lines = [`⏰ <b>Overdue tasks: ${total}</b>`];
  for (const task of tasks) lines.push(`• ${task.date_deadline.slice(0, 10)} — ${escapeHtml(task.name)} (${escapeHtml(task.project_id[1].split(' - ')[0])})`);

  return lines.join('\n');
}

async function serviceStats(odoo: OdooClient): Promise<string> {
  const open = [['stage_id.fold', '=', false]];
  const total = await count(odoo, 'helpdesk.ticket', open);
  const critical = await count(odoo, 'helpdesk.ticket', [...open, ['priority', '=', '3']]);
  const unassigned = await count(odoo, 'helpdesk.ticket', [...open, ['user_id', '=', false]]);
  const slaFailed = await count(odoo, 'helpdesk.ticket', [...open, ['sla_deadline', '<', odooNow()]]);
  const onTime = await slaOnTime(odoo);

  return `🛠 <b>Service</b>\nOpen tickets: ${total}\nCritical: ${critical}\nUnassigned: ${unassigned}\nSLA breached: ${slaFailed}\n${onTime}`;
}

async function pipelineStats(odoo: OdooClient): Promise<string> {
  const opportunities = await odoo.searchRead<{ expected_revenue: number }>('crm.lead', [['type', '=', 'opportunity'], ['active', '=', true]], ['expected_revenue']);
  const orders = await odoo.searchRead<{ amount_untaxed: number }>('sale.order', [['state', '=', 'sale'], ['date_order', '>=', daysAgo(30)]], ['amount_untaxed']);
  const pipeline = opportunities.reduce((sum, row) => sum + row.expected_revenue, 0);
  const sold = orders.reduce((sum, row) => sum + row.amount_untaxed, 0);

  return `💰 <b>Funnel</b>\nOpen opportunities: ${opportunities.length}, expected revenue: UAH ${Math.round(pipeline)}\nConfirmed orders, last 30 days: ${orders.length} for UAH ${Math.round(sold)} excl. VAT\n<i>Demo prices.</i>`;
}

const STATS: Record<string, (odoo: OdooClient) => Promise<string>> = {
  'stats:leads': leadsStats,
  'stats:campaigns': campaignsStats,
  'stats:overdue': overdueStats,
  'stats:service': serviceStats,
  'stats:pipeline': pipelineStats,
};

export const isStatsKey = (data: string) => data in STATS;

export async function buildStats(odoo: OdooClient, key: string): Promise<string> {
  const builder = STATS[key];
  if (builder === undefined) return 'Unknown report.';

  return builder(odoo);
}

export async function buildDigest(odoo: OdooClient): Promise<string> {
  const parts = [await leadsStats(odoo), await overdueStats(odoo), await serviceStats(odoo)];

  return `☀️ <b>Morning digest</b>\n\n${parts.join('\n\n')}`;
}
