import { OdooClient, OdooError } from '../src/odoo-client.js';

// One-off migration: renames user-visible record names from the old brand to Opsline so seeds find them by the new
// name. Technical keys (x_gravity_expense, website.gravity_*, view arch names) stay as they are.
// Usage: npm run rename:brand        (dry run, prints what would change)
//        npm run rename:brand -- --apply

interface NamedRecord {
  id: number;
  name: string;
}

const OLD = 'Gravity';
const NEW = 'Opsline';
const APPLY = process.argv.includes('--apply');

const TARGETS: Array<{ model: string; field: string }> = [
  { model: 'ir.actions.server', field: 'name' },
  { model: 'base.automation', field: 'name' },
  { model: 'ir.cron', field: 'cron_name' },
  { model: 'knowledge.article', field: 'name' },
  { model: 'ai.agent', field: 'name' },
  { model: 'project.project', field: 'name' },
  { model: 'project.tags', field: 'name' },
  { model: 'crm.tag', field: 'name' },
];

const odoo = OdooClient.fromEnv();

async function renameIn(model: string, field: string): Promise<void> {
  let rows: Array<Record<string, unknown> & { id: number }>;

  try {
    rows = await odoo.searchRead(model, [[field, 'ilike', OLD]], ['id', field]);
  } catch (error) {
    if (error instanceof OdooError) {
      console.log(`${model}: skipped (${error.status})`);

      return;
    }
    throw error;
  }

  for (const row of rows) {
    const current = String(row[field] ?? '');
    const next = current.replaceAll(OLD, NEW).replaceAll(OLD.toLowerCase(), NEW.toLowerCase());
    console.log(`${model} #${row.id}: «${current}» → «${next}»`);

    if (APPLY) await odoo.write(model, [row.id], { [field]: next });
  }
}

async function renameToolNames(): Promise<void> {
  const tools = await odoo.searchRead<NamedRecord & { ai_tool_name: string }>('ir.actions.server', [['ai_tool_name', 'ilike', 'gravity_']], ['id', 'name', 'ai_tool_name']);

  for (const tool of tools) {
    const next = tool.ai_tool_name.replace(/^gravity_/, 'opsline_');
    console.log(`tool #${tool.id}: ${tool.ai_tool_name} → ${next}`);

    if (APPLY) await odoo.write('ir.actions.server', [tool.id], { ai_tool_name: next });
  }
}

for (const target of TARGETS) await renameIn(target.model, target.field);
await renameToolNames();

console.log(APPLY ? 'applied' : 'dry run: add -- --apply to write');
