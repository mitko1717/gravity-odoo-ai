import { OdooClient } from '../src/odoo-client.js';
import { ensureField, ensureRecord } from '../src/ensure.js';
import { TICKET_AI_FIELDS } from '../src/config/ticket-fields.js';
import { ensureAiAutomation } from '../src/ai-automation.js';

// Helpdesk: AI fields on tickets, form view tab and ticket triage AI with SLA.

const SLA_HOURS: Array<[priority: string, label: string, hours: number]> = [
  ['3', 'Критична: реакція за 2 год', 2],
  ['2', 'Висока: реакція за 8 год', 8],
  ['1', 'Звичайна: реакція за 24 год', 24],
];

const odoo = OdooClient.fromEnv();

for (const field of TICKET_AI_FIELDS) await ensureField(odoo, 'helpdesk.ticket', field);
console.log(`ticket fields: ${TICKET_AI_FIELDS.length}`);

const [baseView] = await odoo.searchRead<{ res_id: number }>('ir.model.data', [['module', '=', 'helpdesk'], ['name', '=', 'helpdesk_ticket_view_form']], ['res_id']);
if (!baseView) throw new Error('helpdesk ticket form view not found');

const fieldsXml = TICKET_AI_FIELDS.map((field) => `<field name="${field.name}"/>`).join('');
await ensureRecord(odoo, 'ir.ui.view', [['name', '=', 'helpdesk.ticket.form.gravity.ai']], {
  name: 'helpdesk.ticket.form.gravity.ai',
  model: 'helpdesk.ticket',
  type: 'form',
  inherit_id: baseView.res_id,
  arch_db: `<xpath expr="//notebook" position="inside"><page string="Gravity / AI" name="gravity_ai"><group>${fieldsXml}</group></page></xpath>`,
});

const [team] = await odoo.searchRead<{ id: number; name: string }>('helpdesk.team', [], ['id', 'name'], 1);
if (!team) throw new Error('no helpdesk team');

await odoo.write('helpdesk.team', [team.id], { name: 'Сервіс Gravity (демо)', use_sla: true });

const stages = await odoo.call<Array<{ id: number; name: string }>>('helpdesk.stage', 'search_read', {
  domain: [['team_ids', 'in', [team.id]]],
  fields: ['id', 'name'],
  order: 'sequence',
});
const resStage = stages[1] ?? stages[0];
if (!resStage) throw new Error('no helpdesk stages');

for (const [priority, name, hours] of SLA_HOURS) {
  await ensureRecord(odoo, 'helpdesk.sla', [['name', '=', name]], { name, team_id: team.id, criteria_domain: `[("priority", "=", "${priority}")]`, time: hours, stage_id: resStage.id });
}
console.log(`team ${team.id}, SLA reach stage "${resStage.name}": ${SLA_HOURS.length} policies`);

const actionId = await ensureAiAutomation(odoo, {
  model: 'helpdesk.ticket',
  dir: 'odoo/ticket-analysis',
  automationName: 'Gravity: AI-тріаж сервісного звернення',
  actionName: 'Gravity: AI-тріаж тікета',
  readTool: { name: 'Gravity AI Tool: Get ticket data', toolName: 'gravity_get_ticket_data', description: 'Return the current ticket data (untrusted customer input). Call first.' },
  applyTool: { name: 'Gravity AI Tool: Apply ticket analysis', toolName: 'gravity_apply_ticket_analysis', description: 'Save the triage of the current ticket. Call exactly once.' },
});
console.log(`ticket AI action -> ${actionId}`);
