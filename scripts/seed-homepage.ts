import { OdooClient } from '../src/odoo-client.js';
import { homepageArch } from '../src/website/homepage.js';

// Demo homepage, website and company name of the fictional demo company.

const odoo = OdooClient.fromEnv();
const views = await odoo.searchRead<{ id: number; website_id: [number, string] | false }>(
  'ir.ui.view',
  [['key', '=', 'website.homepage']],
  ['id', 'website_id'],
);
const target = views.find((view) => view.website_id && view.website_id[0] === 1) ?? views[0];
if (!target) throw new Error('website.homepage view not found');

await odoo.write('ir.ui.view', [target.id], { arch_db: homepageArch('website.homepage') });
await odoo.write('website', [1], { name: 'Northwind Home Systems (demo)' });
await odoo.write('res.company', [1], {
  name: 'Northwind Home Systems (demo)',
  phone: '+380 00 000 0000',
  email: 'demo@example.com',
});

// Header CTA, text logo and footer were edited in the website builder once; their Ukrainian texts are replaced in
// whichever website views hold them. The footer source of truth is odoo/website/footer-links.xml.
const VIEW_TEXT_FIXES: Array<[uk: string, en: string]> = [
  ['Зв’язатися', 'Contact us'],
  ['Smart Home · демо', 'Northwind Home Systems · demo'],
  ['<h5>Навігація</h5>', '<h5>Navigation</h5>'],
  ['>Головна</a>', '>Home</a>'],
  ['>Залишити заявку</a>', '>Send a request</a>'],
  ['>Записатися на консультацію</a>', '>Book a consultation</a>'],
  ['>Вакансії</a>', '>Careers</a>'],
  ['<h5>Послуги</h5>', '<h5>Services</h5>'],
  ['<li>Розумний дім</li>', '<li>Smart home</li>'],
  ['<li>Електромонтаж</li>', '<li>Electrical installation</li>'],
  ['<li>Інженерні системи</li>', '<li>Engineering systems</li>'],
  ['<li>Сервісне обслуговування</li>', '<li>Service and maintenance</li>'],
  ['<h5>Контакти (демо)</h5>', '<h5>Contacts (demo)</h5>'],
  ['<h5>Про стенд</h5>', '<h5>About this demo</h5>'],
];
const ABOUT_NOTE = /<p>Неофіційний демонстраційний стенд[^<]*<\/p>/g;
const ABOUT_NOTE_EN = '<p>Northwind Home Systems is a fictional company. Demo stand built by Opsline; all data is synthetic.</p>';

const textViews = await odoo.searchRead<{ id: number; arch_db: string }>(
  'ir.ui.view',
  ['|', '|', ['arch_db', 'ilike', 'Зв’язатися'], ['arch_db', 'ilike', 'Про стенд'], ['arch_db', 'ilike', 'Smart Home · демо']],
  ['id', 'arch_db'],
);

for (const view of textViews) {
  const fixed = VIEW_TEXT_FIXES.reduce((arch, [uk, en]) => arch.replaceAll(uk, en), view.arch_db).replace(ABOUT_NOTE, ABOUT_NOTE_EN);
  if (fixed === view.arch_db) continue;

  await odoo.write('ir.ui.view', [view.id], { arch_db: fixed });
  console.log(`view ${view.id}: Ukrainian texts replaced`);
}

// Demo content is English: website default language and the admin's UI language.
const [english] = await odoo.searchRead<{ id: number }>('res.lang', [['code', '=', 'en_US'], ['active', 'in', [true, false]]], ['id'], 1);
if (!english) throw new Error('en_US language not found');

await odoo.write('res.lang', [english.id], { active: true });
await odoo.write('website', [1], { language_ids: [[4, english.id]], default_lang_id: english.id });

const [adminRef] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'base'], ['name', '=', 'user_admin']], ['res_id']);
if (adminRef) await odoo.write('res.users', [adminRef.res_id], { lang: 'en_US' });

console.log(`homepage view ${target.id} updated (website-specific: ${Boolean(target.website_id)})`);
console.log(`open: ${process.env.ODOO_URL}/`);
