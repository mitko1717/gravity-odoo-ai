import { OdooClient } from '../src/odoo-client.js';
import { ensureRecord } from '../src/ensure.js';

// Own Ukrainian «thank you» page for the lead form. The generic /contactus-thank-you page is rendered
// from Odoo's base templates and translations, so it stays untouched; the form redirects here instead.
const KEY = 'website.gravity_zayavka_thanks';
const URL = '/zayavka-dyakuyemo';

const content = `
<section class="pt96 pb96">
  <div class="container text-center">
    <h1 class="display-4">Дякуємо! Заявку отримано.</h1>
    <p class="lead mt-3">Менеджер зв’яжеться з вами найближчим часом, щоб уточнити деталі об’єкта та домовитися про консультацію.</p>
    <p class="mt-3">Якщо щось термінове — опишіть проблему ще раз у формі з позначкою «терміново».</p>
    <p class="mt-4"><a class="btn btn-primary btn-lg" href="/">На головну</a> <a class="btn btn-outline-primary btn-lg ms-2" href="/zayavka">Ще одна заявка</a></p>
    <p class="text-muted small mt-5">Неофіційний демонстраційний стенд для тестового завдання. Дані не передаються компанії Opsline.</p>
  </div>
</section>`;

const odoo = OdooClient.fromEnv();
const arch = `<t t-name="${KEY}"><t t-call="website.layout"><div id="wrap" class="oe_structure">${content}</div></t></t>`;

const viewId = await ensureRecord(odoo, 'ir.ui.view', [['key', '=', KEY]], {
  name: 'Дякуємо за заявку',
  key: KEY,
  type: 'qweb',
  arch_db: arch,
});

const pageId = await ensureRecord(odoo, 'website.page', [['url', '=', URL]], {
  url: URL,
  view_id: viewId,
  website_id: 1,
  is_published: true,
  website_indexed: false,
});

console.log(`thank-you view ${viewId}, page ${pageId}: ${process.env.ODOO_URL}${URL}`);
