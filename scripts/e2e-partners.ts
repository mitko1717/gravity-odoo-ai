import { OdooClient } from '../src/odoo-client.js';
import { DEMO_PARTNERS } from '../src/config/partners.js';

interface PartnerRow {
  id: number;
  name: string;
  x_partner_last_contact: string | false;
  activity_ids: number[];
}

const odoo = OdooClient.fromEnv();
const names = DEMO_PARTNERS.map((partner) => partner.name);
const automationIds = await odoo.search('base.automation', [['name', '=', 'Opsline: нагадування про контакт з партнером']]);
const [cron] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'base_automation'], ['model', '=', 'ir.cron']], ['res_id']);
if (!cron) throw new Error('base_automation cron not found');

const runScheduler = async () => {
  // on_time rules only process records whose trigger date is after last_run; reset it so the test is repeatable.
  await odoo.write('base.automation', automationIds, { last_run: false });
  await odoo.call('ir.cron', 'method_direct_trigger', { ids: [cron.res_id] });
};

const report = async (title: string) => {
  const rows = await odoo.searchRead<PartnerRow>('res.partner', [['name', 'in', names]], ['name', 'x_partner_last_contact', 'activity_ids']);
  console.log(title);
  for (const row of rows) console.log(`  ${row.x_partner_last_contact} | open activities: ${row.activity_ids.length} | ${row.name}`);

  return rows;
};

// Repeatable start: restore demo dates and close reminders left by previous runs.
const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
for (const partner of DEMO_PARTNERS) {
  const ids = await odoo.search('res.partner', [['name', '=', partner.name]]);
  await odoo.write('res.partner', ids, { x_partner_last_contact: daysAgo(partner.daysSinceContact) });
}
const oldReminderIds = await odoo.search('mail.activity', [['res_model', '=', 'res.partner'], ['summary', '=like', 'Зв’язатися з партнером%']]);
if (oldReminderIds.length > 0) await odoo.call('mail.activity', 'unlink', { ids: oldReminderIds });

await runScheduler();
await report('after scheduler run 1 (expect reminders only for 40 and 90 days):');

await runScheduler();
const rows = await report('after scheduler run 2 (expect no duplicates):');

const builder = rows.find((row) => row.name.startsWith('Забудовник'));
const [markActionId] = await odoo.search('ir.actions.server', [['name', '=', 'Партнер: контакт відбувся']]);
if (!builder || markActionId === undefined) throw new Error('builder partner or mark action not found');

await odoo.call('ir.actions.server', 'run', {
  ids: [markActionId],
  context: { active_id: builder.id, active_ids: [builder.id], active_model: 'res.partner' },
});
await report('after «контакт відбувся» on the developer (expect today, 0 activities):');
