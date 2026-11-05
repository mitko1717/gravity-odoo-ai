import { OdooClient } from '../src/odoo-client.js';

const names = process.argv.slice(2);

if (names.length === 0) throw new Error('usage: npm run install:modules -- <module> [...]');

const odoo = OdooClient.fromEnv();
const ids = await odoo.search('ir.module.module', [['name', 'in', names], ['state', '!=', 'installed']]);

if (ids.length > 0) await odoo.call('ir.module.module', 'button_immediate_install', { ids });

const states = await odoo.searchRead<{ name: string; state: string }>('ir.module.module', [['name', 'in', names]], ['name', 'state']);

for (const module of states) console.log(`${module.state.padEnd(12)} ${module.name}`);
