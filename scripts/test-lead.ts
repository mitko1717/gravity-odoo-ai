import { OdooClient } from '../src/odoo-client.js';

const odoo = OdooClient.fromEnv();
const leadId = await odoo.create('crm.lead', {
  name: 'Розумний дім, будинок 180 м² (тест)',
  contact_name: 'Олександр Тестовий',
  email_from: 'test.client@example.com',
  phone: '+380 00 000 0001',
  x_object_type: 'house',
  x_city: 'Київська область',
  x_area_m2: 180,
  x_service: 'smart_home',
  x_budget_text: '15 000 доларів',
  description: 'Хочу встановити систему розумного дому в будинку 180 м² під Києвом. Цікавить керування освітленням, кліматом та безпекою. Бюджет орієнтовно 15 000 доларів. Хотів би почати роботи наступного місяця.',
});

console.log(`lead -> ${leadId}`);
console.log(`open: ${process.env.ODOO_URL}/odoo/crm/${leadId}`);
