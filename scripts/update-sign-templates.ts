import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';

// Replaces the PDFs of the two demo Sign templates with the English versions in data/sign/ and renames them.
// Signature fields keep their positions: the English PDFs put the signature lines where the old ones were.
// Usage: npm run update:sign        (dry run: shows templates and how their PDF is stored)
//        npm run update:sign -- --apply

const APPLY = process.argv.includes('--apply');

const TEMPLATES: Array<{ oldName: string; newName: string; file: string }> = [
  { oldName: 'Договір (демо).pdf', newName: 'Contract (demo).pdf', file: 'data/sign/contract-demo.pdf' },
  { oldName: 'Акт приймання (демо).pdf', newName: 'Acceptance certificate (demo).pdf', file: 'data/sign/acceptance-act-demo.pdf' },
];

const odoo = OdooClient.fromEnv();
const fields = await odoo.call<Record<string, { type: string; relation?: string }>>('sign.template', 'fields_get', { attributes: ['type', 'relation'] });
const attachmentFields = Object.entries(fields).filter(([, spec]) => spec.relation === 'ir.attachment').map(([name]) => name);
console.log(`sign.template attachment fields: ${attachmentFields.join(', ') || 'none'}`);

if (!attachmentFields.includes('attachment_id')) throw new Error('sign.template has no attachment_id: stop and inspect');

for (const template of TEMPLATES) {
  const [row] = await odoo.searchRead<{ id: number; attachment_id: [number, string] | false }>(
    'sign.template',
    ['|', ['name', '=', template.oldName], ['name', '=', template.newName]],
    ['id', 'attachment_id'],
  );
  if (!row || row.attachment_id === false) {
    console.log(`${template.oldName}: not found`);
    continue;
  }

  console.log(`sign.template #${row.id} (attachment #${row.attachment_id[0]}) → «${template.newName}» from ${template.file}`);
  if (!APPLY) continue;

  const datas = (await readFile(template.file)).toString('base64');
  await odoo.write('ir.attachment', [row.attachment_id[0]], { datas, name: template.newName });
  await odoo.write('sign.template', [row.id], { name: template.newName });
}

console.log(APPLY ? 'applied' : 'dry run: add -- --apply to write');
