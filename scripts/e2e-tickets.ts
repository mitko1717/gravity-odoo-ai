import { OdooClient } from '../src/odoo-client.js';

interface TicketRow {
  id: number;
  name: string;
  priority: string;
  x_ai_category: string | false;
  x_ai_urgency: string | false;
  user_id: [number, string] | false;
  sla_deadline: string | false;
}

const TICKETS = [
  { name: 'Запах гару від щитка', description: 'Після грози в щитку пахне горілим, один автомат гарячий. Розумний дім працює частково.' },
  { name: 'Не працює застосунок', description: 'З учора застосунок не бачить контролер, світло вмикається лише вимикачами.' },
  { name: 'Додати сценарій', description: 'Хочемо додати сценарій «Кіно» у вітальні: приглушити світло й закрити штори.' },
];

const odoo = OdooClient.fromEnv();
const [team] = await odoo.searchRead<{ id: number }>('helpdesk.team', [], ['id'], 1);

if (!team) throw new Error('no helpdesk team');

for (const ticket of TICKETS) {
  const started = Date.now();
  const id = await odoo.create('helpdesk.ticket', { ...ticket, team_id: team.id });
  const [row] = await odoo.searchRead<TicketRow>('helpdesk.ticket', [['id', '=', id]], ['id', 'name', 'priority', 'x_ai_category', 'x_ai_urgency', 'user_id', 'sla_deadline']);
  const owner = row?.user_id ? row.user_id[1] : '—';

  console.log(`#${id} ${Date.now() - started}ms | ${row?.x_ai_category}/${row?.x_ai_urgency} | priority ${row?.priority} | SLA ${row?.sla_deadline} | ${owner} | ${ticket.name}`);
}

console.log(`open: ${process.env.ODOO_URL}/odoo/helpdesk`);
