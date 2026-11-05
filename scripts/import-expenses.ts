import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';

// Demo «collect data from spreadsheets»: CSV object numbers map to the 3 latest implementation projects.
const SOURCE = 'data/expenses-demo.csv';
const MODEL = 'x_gravity_expense';

interface ExpenseRow {
  date: string;
  object: number;
  category: string;
  amount: number;
}

const parseCsv = (text: string): ExpenseRow[] => {
  const [, ...lines] = text.trim().split('\n');

  return lines.map((line) => {
    const [date = '', object = '', category = '', amount = ''] = line.split(',');

    return { date, object: Number(object), category, amount: Number(amount) };
  });
};

const odoo = OdooClient.fromEnv();
const rows = parseCsv(await readFile(SOURCE, 'utf8'));

const latest = await odoo.call<Array<{ id: number; name: string }>>('project.project', 'search_read', {
  domain: [['sale_order_id', '!=', false], ['is_template', '=', false]],
  fields: ['name'],
  order: 'id desc',
  limit: 3,
});
if (latest.length === 0) throw new Error('no implementation projects, run e2e:project first');

const projects = [...latest].reverse();

const oldIds = await odoo.search(MODEL, [['x_source', '=', SOURCE]]);
if (oldIds.length > 0) await odoo.call(MODEL, 'unlink', { ids: oldIds });

for (const row of rows) {
  const project = projects[(row.object - 1) % projects.length];
  if (!project) throw new Error(`no project for object ${row.object}`);

  await odoo.create(MODEL, {
    x_name: `${row.category} ${row.date}`,
    x_project_id: project.id,
    x_date: row.date,
    x_category: row.category,
    x_amount: row.amount,
    x_source: SOURCE,
  });
}

projects.forEach((project, index) => console.log(`object ${index + 1} -> project ${project.id} «${project.name}»`));
console.log(`imported ${rows.length} rows (replaced ${oldIds.length})`);
