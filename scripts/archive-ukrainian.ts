import { OdooClient } from '../src/odoo-client.js';

// One-off cleanup after the English switch: archives (reversible) old demo records whose names are still Ukrainian,
// deletes stale calendar bookings and activities. The regression run then recreates fresh English demo data.
// Usage: npm run archive:ukrainian        (dry run)
//        npm run archive:ukrainian -- --apply

const APPLY = process.argv.includes('--apply');
const UKRAINIAN = /[а-яіїєґА-ЯІЇЄҐ]/;

const ARCHIVE_MODELS = ['crm.lead', 'res.partner', 'project.project', 'project.task', 'helpdesk.ticket', 'hr.applicant', 'knowledge.article'];
const DELETE_MODELS = ['calendar.event', 'mail.activity'];

const odoo = OdooClient.fromEnv();

async function ukrainianIds(model: string, domain: unknown[] = []): Promise<number[]> {
  const rows = await odoo.searchRead<{ id: number; display_name: string }>(model, domain, ['id', 'display_name']);

  return rows.filter((row) => UKRAINIAN.test(row.display_name)).map((row) => row.id);
}

// Partners linked to users (the admin, the company) are never archived.
const PARTNER_DOMAIN = [['user_ids', '=', false], ['is_company', 'in', [true, false]], ['id', '!=', 1]];

for (const model of ARCHIVE_MODELS) {
  const domain = model === 'res.partner' ? PARTNER_DOMAIN : [];
  const ids = await ukrainianIds(model, domain);
  console.log(`${model}: archive ${ids.length}`);

  if (APPLY && ids.length > 0) await odoo.write(model, ids, { active: false });
}

for (const model of DELETE_MODELS) {
  const ids = await ukrainianIds(model);
  console.log(`${model}: delete ${ids.length}`);

  if (APPLY && ids.length > 0) await odoo.call(model, 'unlink', { ids });
}

console.log(APPLY ? 'applied' : 'dry run: add -- --apply to write');
