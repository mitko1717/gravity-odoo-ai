import { InlineKeyboard } from 'grammy';
import type { OdooClient } from '../odoo-client.js';
import type { BotState } from './state.js';
import type { Notification } from './events.js';
import { escapeHtml, kyivTime, recordUrl } from './format.js';

// SLA control by plain rules: Odoo Helpdesk computes deadlines, the bot only reports breaches.
const toOdooDate = (date: Date) => date.toISOString().slice(0, 19).replace('T', ' ');

interface SlaStatusRow {
  id: number;
  ticket_id: [number, string] | false;
  sla_id: [number, string] | false;
  deadline: string | false;
  status: string;
}

// Breached = still open after the deadline, or reached late.
const breachDomain = (now: string) => ['|', ['status', '=', 'failed'], '&', ['status', '=', 'ongoing'], ['deadline', '<', now]];

function breachNotification(row: SlaStatusRow, odooUrl: string): Notification | undefined {
  if (row.ticket_id === false) return undefined;

  const [ticketId, ticketName] = row.ticket_id;
  const deadline = row.deadline ? kyivTime(row.deadline) : '—';
  const policy = row.sla_id ? row.sla_id[1] : '—';
  const keyboard = new InlineKeyboard()
    .text('🙋 Беру', `ticket:take:${ticketId}`)
    .row()
    .url('Відкрити в Odoo', recordUrl(odooUrl, 'helpdesk.ticket', ticketId));

  return {
    text: `🚨 <b>SLA прострочено</b>\nТікет #${ticketId}: ${escapeHtml(ticketName)}\nПолітика: ${escapeHtml(policy)} · дедлайн: ${deadline} (Київ)`,
    keyboard,
    role: 'pm',
  };
}

export async function slaBreaches(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const rows = await odoo.searchRead<SlaStatusRow>(
    'helpdesk.sla.status',
    [...breachDomain(toOdooDate(new Date())), ['id', 'not in', state.slaNotified]],
    ['ticket_id', 'sla_id', 'deadline', 'status'],
  );

  // First run: remember existing breaches silently, notify only new ones.
  const isFirstRun = state.slaReady === false;
  state.slaNotified.push(...rows.map((row) => row.id));
  state.slaReady = true;
  if (isFirstRun) return [];

  return rows.map((row) => breachNotification(row, odooUrl)).filter((item): item is Notification => item !== undefined);
}

/** On-time share over the last 30 days: reached / (reached + failed); ongoing SLAs are not counted. */
export async function slaOnTime(odoo: OdooClient): Promise<string> {
  const since = toOdooDate(new Date(Date.now() - 30 * 24 * 3600 * 1000));
  const period = [['deadline', '>=', since]];
  const reached = await odoo.call<number>('helpdesk.sla.status', 'search_count', { domain: [...period, ['status', '=', 'reached']] });
  const failed = await odoo.call<number>('helpdesk.sla.status', 'search_count', { domain: [...period, ['status', '=', 'failed']] });
  const total = reached + failed;
  if (total === 0) return 'SLA вчасно (30 днів): немає завершених';

  const percent = Math.round((reached / total) * 100);

  return `SLA вчасно (30 днів): ${percent}% (${reached} з ${total})`;
}
