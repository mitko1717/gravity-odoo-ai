import { OdooClient } from '../src/odoo-client.js';

// E2E: service tickets → AI category/urgency → priority, assignee and SLA; critical ones notify the bot.

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
  { name: 'Burning smell from the switchboard', description: 'After a thunderstorm the switchboard smells burnt and one breaker is hot. The smart home works only partly.' },
  { name: 'App not working', description: 'Since yesterday the app cannot see the controller; lights only work from wall switches.' },
  { name: 'Add a scene', description: 'We want to add a «Movie» scene in the living room: dim the lights and close the blinds.' },
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
