import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';
import { ensureAiButton } from '../src/ai-automation.js';
import { WEEKLY_ACTION, WEEKLY_ARTICLE } from '../src/config/weekly.js';

// Weekly owner report: a Knowledge article filled by an AI action (rules compute the figures, AI writes
// 3 sentences and attention items). A scheduled action runs it every Monday 08:00 Kyiv; the bot delivers it.
const CRON_NAME = 'Gravity: тижневий звіт керівнику';
const FIRST_RUN_UTC = '2026-11-09 06:00:00';

const odoo = OdooClient.fromEnv();

const articleId = await ensureRecord(odoo, 'knowledge.article', [['name', '=', WEEKLY_ARTICLE]], {
  name: WEEKLY_ARTICLE,
  internal_permission: 'write',
});

const actionId = await ensureAiButton(odoo, {
  model: 'knowledge.article',
  dir: 'odoo/weekly-report',
  actionName: WEEKLY_ACTION,
  readTool: { name: 'Gravity AI Tool: Get weekly data', toolName: 'gravity_get_weekly_data', description: 'Return this and previous week figures for leads, sales, projects and service. Call first.' },
  applyTool: { name: 'Gravity AI Tool: Apply weekly report', toolName: 'gravity_apply_weekly_report', description: 'Write the weekly report into the current article. Call exactly once.' },
});
console.log(`weekly article -> ${articleId}, AI button -> ${actionId}`);

const [articleModelId] = await odoo.search('ir.model', [['model', '=', 'knowledge.article']]);
if (articleModelId === undefined) throw new Error('knowledge.article model not found');

const cronCode = [
  `article = env['knowledge.article'].browse(${articleId})`,
  `action = env['ir.actions.server'].browse(${actionId})`,
  "action.with_context(active_model='knowledge.article', active_id=article.id, active_ids=article.ids).run()",
].join('\n');

// nextcall is set only on creation, so a manual reschedule in Odoo survives reruns.
const [existingCron] = await odoo.search('ir.cron', [['name', '=', CRON_NAME]]);
const cronValues = {
  name: CRON_NAME,
  model_id: articleModelId,
  state: 'code',
  code: cronCode,
  interval_number: 1,
  interval_type: 'weeks',
  active: true,
};
const cronId = existingCron === undefined
  ? await odoo.create('ir.cron', { ...cronValues, nextcall: FIRST_RUN_UTC })
  : await ensureRecord(odoo, 'ir.cron', [['id', '=', existingCron]], cronValues);

console.log(`weekly cron -> ${cronId} (first run ${FIRST_RUN_UTC} UTC = Monday 08:00 Kyiv)`);
