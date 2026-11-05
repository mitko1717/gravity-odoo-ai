import { OdooClient } from '../src/odoo-client.js';

// Translates the form «thank you» page. Replaces only exact English phrases; prints how many were found.
const PHRASES: Array<[string, string]> = [
  ['Thank You!', 'Дякуємо!'],
  ['Your message has been sent.', 'Заявку отримано.'],
  ['We will get back to you shortly.', 'Інженер зв’яжеться з вами найближчим часом.'],
  ['Go to Homepage', 'На головну'],
];

const odoo = OdooClient.fromEnv();
const views = await odoo.searchRead<{ id: number; key: string | false; arch_db: string }>(
  'ir.ui.view',
  [['arch_db', 'ilike', 'Your message has been sent']],
  ['key', 'arch_db'],
);

for (const view of views) {
  let arch = view.arch_db;
  const found: string[] = [];

  for (const [english, ukrainian] of PHRASES) {
    if (arch.includes(english)) found.push(english);
    arch = arch.split(english).join(ukrainian);
  }

  if (found.length > 0) await odoo.write('ir.ui.view', [view.id], { arch_db: arch });
  console.log(`${view.id} ${view.key || ''}: replaced ${found.length}/${PHRASES.length}`);
}
