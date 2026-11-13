import { readFile } from 'node:fs/promises';
import { OdooClient } from '../src/odoo-client.js';

// Replaces the PDFs of the two demo Sign templates with the English versions in data/sign/ and renames them.
// Signature fields keep their positions: the English PDFs put the signature lines where the old ones were.
// Usage: npm run update:sign        (dry run: shows which attachment will be replaced)
//        npm run update:sign -- --apply

const APPLY = process.argv.includes('--apply');

const TEMPLATES: Array<{ oldName: string; newName: string; file: string }> = [
  { oldName: 'Договір (демо).pdf', newName: 'Contract (demo).pdf', file: 'data/sign/contract-demo.pdf' },
  { oldName: 'Акт приймання (демо).pdf', newName: 'Acceptance certificate (demo).pdf', file: 'data/sign/acceptance-act-demo.pdf' },
];

const odoo = OdooClient.fromEnv();

const attachmentFields = await odoo.call<Record<string, { type: string }>>('ir.attachment', 'fields_get', { attributes: ['type'] });
const binaryFields = Object.entries(attachmentFields).filter(([, spec]) => spec.type === 'binary').map(([name]) => name);
console.log(`ir.attachment binary fields: ${binaryFields.join(', ')}`);

// Odoo 20 has no 'datas'; 'raw' is the file content. Probe once how the API decodes it: a base64 string of
// 'hello' must give a 5-byte file, otherwise the base64 text itself was stored.
const PROBE_TEXT = 'hello';
const probeId = await odoo.create('ir.attachment', { name: 'opsline-probe.txt', raw: Buffer.from(PROBE_TEXT).toString('base64') });
const [probe] = await odoo.searchRead<{ file_size: number }>('ir.attachment', [['id', '=', probeId]], ['file_size']);
await odoo.call('ir.attachment', 'unlink', { ids: [probeId] });

const rawTakesBase64 = probe?.file_size === PROBE_TEXT.length;
console.log(`raw accepts base64: ${rawTakesBase64} (probe file_size ${probe?.file_size})`);
if (!rawTakesBase64) throw new Error('raw does not decode base64 over the API: stop and inspect');

// Odoo 20: the PDF lives on sign.document (template.document_ids), each with its own ir.attachment.
for (const template of TEMPLATES) {
  const [row] = await odoo.searchRead<{ id: number; document_ids: number[] }>(
    'sign.template',
    ['|', ['name', '=', template.oldName], ['name', '=', template.newName]],
    ['id', 'document_ids'],
  );
  if (!row) {
    console.log(`${template.oldName}: not found`);
    continue;
  }

  const documents = await odoo.searchRead<{ id: number; attachment_id: [number, string] | false }>(
    'sign.document',
    [['id', 'in', row.document_ids]],
    ['id', 'attachment_id'],
  );
  const [document] = documents;
  if (documents.length !== 1 || !document || document.attachment_id === false) {
    console.log(`sign.template #${row.id}: expected one document with a PDF, found ${documents.length}; skipped`);
    continue;
  }

  console.log(`sign.template #${row.id} → document #${document.id}, attachment #${document.attachment_id[0]} → «${template.newName}» from ${template.file}`);
  if (!APPLY) continue;

  const datas = (await readFile(template.file)).toString('base64');
  await odoo.write('ir.attachment', [document.attachment_id[0]], { raw: datas, name: template.newName });
  await odoo.write('sign.template', [row.id], { name: template.newName });
}

console.log(APPLY ? 'applied' : 'dry run: add -- --apply to write');
