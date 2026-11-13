import { OdooClient } from '../src/odoo-client.js';

// Removes records created by e2e scripts (partner «E2E Demo Client», leads «(test)»).
// Posted/paid invoices are kept on purpose: accounting entries are not deleted, their orders are only archived.
interface OrderRow {
  id: number;
  name: string;
  project_ids: number[];
  invoice_ids: number[];
}

const odoo = OdooClient.fromEnv();

const errorText = (error: unknown) => (error instanceof Error ? error.message.split('\n')[0] : String(error));

const testLeads = await odoo.search('crm.lead', [['name', 'like', '(test)']]);
if (testLeads.length > 0) await odoo.call('crm.lead', 'unlink', { ids: testLeads });
console.log(`leads removed: ${testLeads.length}`);

// Archived partners included: previous runs archive them, but new e2e orders may still point to them.
const e2ePartners = await odoo.search('res.partner', [['name', '=', 'E2E Demo Client'], ['active', 'in', [true, false]]]);
const orders = await odoo.searchRead<OrderRow>('sale.order', [['partner_id', 'in', e2ePartners]], ['name', 'project_ids', 'invoice_ids']);
const orderNames = orders.map((order) => order.name);
const projectIds = [...new Set(orders.flatMap((order) => order.project_ids))];

const projects = await odoo.searchRead<{ name: string }>('project.project', [['id', 'in', projectIds]], ['name']);
const slotIds: number[] = [];
for (const project of projects) slotIds.push(...(await odoo.search('planning.slot', [['name', 'like', `${project.name} — `]])));
if (slotIds.length > 0) await odoo.call('planning.slot', 'unlink', { ids: slotIds });
console.log(`planning shifts removed: ${slotIds.length}`);

const rfqIds = await odoo.search('purchase.order', [['origin', 'in', orderNames], ['state', 'in', ['draft', 'sent', 'cancel']]]);
if (rfqIds.length > 0) {
  await odoo.call('purchase.order', 'button_cancel', { ids: rfqIds });
  await odoo.call('purchase.order', 'unlink', { ids: rfqIds });
}
console.log(`RFQs removed: ${rfqIds.length}`);

const draftInvoiceIds = await odoo.search('account.move', [['id', 'in', orders.flatMap((order) => order.invoice_ids)], ['state', '=', 'draft']]);
if (draftInvoiceIds.length > 0) await odoo.call('account.move', 'unlink', { ids: draftInvoiceIds });
console.log(`draft invoices removed: ${draftInvoiceIds.length}`);

const removed: string[] = [];
const kept: string[] = [];
for (const order of orders) {
  try {
    await odoo.call('sale.order', 'action_cancel', { ids: [order.id] });
    await odoo.call('sale.order', 'unlink', { ids: [order.id] });
    removed.push(order.name);
  } catch (error) {
    kept.push(`${order.name} (${errorText(error)})`);
  }
}
console.log(`orders removed: ${removed.join(', ') || 'none'}`);
console.log(`orders kept (posted invoices): ${kept.join('; ') || 'none'}`);

if (projectIds.length > 0) await odoo.write('project.project', projectIds, { active: false });
if (e2ePartners.length > 0) await odoo.write('res.partner', e2ePartners, { active: false });
console.log(`projects archived: ${projectIds.length}, partners archived: ${e2ePartners.length}`);

// e2e for tickets, applicants and meetings recreate the same demo records: keep only the newest one per name.
type NamedRow = { id: number } & Record<string, unknown>;

const dedupeByName = async (model: string, domain: unknown[], nameField: string, mode: 'unlink' | 'archive') => {
  const rows = await odoo.call<NamedRow[]>(model, 'search_read', { domain, fields: [nameField], order: 'id desc' });
  const seen = new Set<string>();
  const extra: number[] = [];

  for (const row of rows) {
    const name = String(row[nameField] ?? '');
    if (seen.has(name)) extra.push(row.id);
    seen.add(name);
  }

  if (extra.length > 0 && mode === 'unlink') await odoo.call(model, 'unlink', { ids: extra });
  if (extra.length > 0 && mode === 'archive') await odoo.write(model, extra, { active: false });
  console.log(`${model}: ${mode} duplicates ${extra.length}, kept ${seen.size}`);
};

await dedupeByName('helpdesk.ticket', [], 'name', 'unlink');
await dedupeByName('hr.applicant', [], 'partner_name', 'archive');
await dedupeByName('project.task', [['tag_ids.name', '=', 'AI draft']], 'name', 'unlink');
