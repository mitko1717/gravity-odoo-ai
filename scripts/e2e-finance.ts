import { OdooClient } from '../src/odoo-client.js';

// E2E: runs «AI: управлінський звіт» on its Knowledge article and prints the result.

const odoo = OdooClient.fromEnv();

const [articleId] = await odoo.search('knowledge.article', [['name', '=', 'Управлінський звіт по об’єктах (демо)']]);
const [actionId] = await odoo.search('ir.actions.server', [['name', '=', 'AI: управлінський звіт']]);
if (articleId === undefined || actionId === undefined) throw new Error('run seed:finance first');

const started = Date.now();
await odoo.call('ir.actions.server', 'run', {
  ids: [actionId],
  context: { active_id: articleId, active_ids: [articleId], active_model: 'knowledge.article' },
});
console.log(`AI report done in ${((Date.now() - started) / 1000).toFixed(1)} s`);

const [article] = await odoo.searchRead<{ body: string }>('knowledge.article', [['id', '=', articleId]], ['body']);
const text = (article?.body ?? '')
  .replace(/<\/(td|th)>/g, ' | ')
  .replace(/<br\/?>|<\/(p|tr|h2|h3)>/g, '\n')
  .replace(/<[^>]+>/g, '');
console.log(text);
console.log(`open: ${process.env.ODOO_URL}/odoo/knowledge/${articleId}`);
