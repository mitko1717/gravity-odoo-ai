import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord } from '../src/ensure.js';
import { ensureAiButton } from '../src/ai-automation.js';
import { CAMPAIGNS, MARKETING_ARTICLE } from '../src/config/marketing.js';

// Marketing: UTM campaigns with demo ad spend and synthetic leads per campaign.

const odoo = OdooClient.fromEnv();

await ensureField(odoo, 'utm.campaign', { name: 'x_ad_spend', label: 'Рекламний бюджет, грн (демо)', type: 'float' });

const [adminRef] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'base'], ['name', '=', 'user_admin']], ['res_id']);
if (!adminRef) throw new Error('base.user_admin not found');

const [stage] = await odoo.searchRead<{ id: number }>('utm.stage', [], ['id'], 1);
if (!stage) throw new Error('no utm.stage');

for (const campaign of CAMPAIGNS) {
  const sourceId = await ensureRecord(odoo, 'utm.source', [['name', '=', campaign.source]], { name: campaign.source });
  const mediumId = await ensureRecord(odoo, 'utm.medium', [['name', '=', campaign.medium]], { name: campaign.medium });
  const campaignId = await ensureRecord(odoo, 'utm.campaign', [['name', '=', campaign.key]], {
    name: campaign.key,
    title: campaign.title,
    user_id: adminRef.res_id,
    stage_id: stage.id,
    x_ad_spend: campaign.spend,
  });
  console.log(`campaign ${campaignId} ${campaign.key}: source ${sourceId}, medium ${mediumId}, spend ${campaign.spend}`);
}

const articleId = await ensureRecord(odoo, 'knowledge.article', [['name', '=', MARKETING_ARTICLE]], {
  name: MARKETING_ARTICLE,
  internal_permission: 'write',
});
const actionId = await ensureAiButton(odoo, {
  model: 'knowledge.article',
  dir: 'odoo/marketing-report',
  actionName: 'AI: маркетинговий звіт',
  readTool: { name: 'Opsline AI Tool: Get marketing data', toolName: 'opsline_get_marketing_data', description: 'Return per-campaign spend, leads, qualified leads, quotations and requested services. Call first.' },
  applyTool: { name: 'Opsline AI Tool: Apply marketing report', toolName: 'opsline_apply_marketing_report', description: 'Write the marketing report into the current article. Call exactly once.' },
});
console.log(`marketing article -> ${articleId}, AI button -> ${actionId}`);
