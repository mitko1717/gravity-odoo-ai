import { OdooClient } from '../src/odoo-client.js';

// Creates one synthetic «(test)» lead to trigger the AI analysis by hand.

const odoo = OdooClient.fromEnv();
const leadId = await odoo.create('crm.lead', {
  name: 'Smart home, house 180 m² (test)',
  contact_name: 'Alex Test',
  email_from: 'test.client@example.com',
  phone: '+380 00 000 0001',
  x_object_type: 'house',
  x_city: 'Kyiv region',
  x_area_m2: 180,
  x_service: 'smart_home',
  x_budget_text: '15,000 dollars',
  description: 'I want to install a smart home system in a 180 m² house near Kyiv. Interested in lighting, climate and security control. Budget about 15,000 dollars. I would like to start next month.',
});

console.log(`lead -> ${leadId}`);
console.log(`open: ${process.env.ODOO_URL}/odoo/crm/${leadId}`);
