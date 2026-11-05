import { InlineKeyboard } from 'grammy';
import type { OdooClient } from '../odoo-client.js';
import type { BotState } from './state.js';
import { PRIORITY_LABEL, escapeHtml, missingLabels, recordUrl, serviceLabels, stripHtml } from './format.js';

export interface Notification {
  text: string;
  keyboard: InlineKeyboard;
}

interface LeadRow {
  id: number;
  name: string;
  contact_name: string | false;
  x_city: string | false;
  x_area_m2: number;
  x_ai_priority: string | false;
  x_ai_services: string | false;
  x_ai_budget_usd: number;
  x_ai_summary: string | false;
  x_ai_missing: string | false;
  x_ai_next_action: string | false;
  stage_id?: [number, string] | false;
  user_id?: [number, string] | false;
}

const maxId = (rows: Array<{ id: number }>, current: number) => rows.reduce((max, row) => Math.max(max, row.id), current);

const LEAD_FIELDS = ['name', 'contact_name', 'x_city', 'x_area_m2', 'x_ai_priority', 'x_ai_services', 'x_ai_budget_usd', 'x_ai_summary', 'x_ai_missing', 'x_ai_next_action'];

// A lead is «in work» once it left the first pipeline stage (the AI assigns a salesperson to every lead on creation).
async function firstStageId(odoo: OdooClient): Promise<number | undefined> {
  const [stage] = await odoo.call<Array<{ id: number }>>('crm.stage', 'search_read', { domain: [], fields: ['id'], order: 'sequence, id', limit: 1 });

  return stage?.id;
}

const isTaken = (lead: LeadRow, newStageId: number | undefined): boolean => {
  if (lead.stage_id === undefined || lead.stage_id === false) return false;

  return lead.stage_id[0] !== newStageId;
};

// /leads: compact list; /lead_<id>: one card with buttons.
export async function leadsList(odoo: OdooClient, limit = 15): Promise<string> {
  const rows = await odoo.call<LeadRow[]>('crm.lead', 'search_read', {
    domain: [['x_ai_status', '!=', 'pending'], ['order_ids', '=', false], ['type', '=', 'opportunity']],
    fields: ['name', 'x_ai_priority', 'stage_id', 'user_id'],
    order: 'id desc',
    limit,
  });
  if (rows.length === 0) return 'Немає лідів без пропозиції.';

  const newStageId = await firstStageId(odoo);
  const lines = rows.map((lead) => {
    const priority = (PRIORITY_LABEL[String(lead.x_ai_priority)] ?? '—').split(' ')[0];
    const status = isTaken(lead, newStageId) ? '🟢' : '🆕';
    const stage = lead.stage_id ? lead.stage_id[1] : '—';
    const name = lead.name.length > 40 ? `${lead.name.slice(0, 40)}…` : lead.name;

    return `${status}${priority} /lead_${lead.id} · ${escapeHtml(stage)}\n      ${escapeHtml(name)}`;
  });

  const legend = '🆕 нова · 🟢 в роботі · 🔴🟡⚪ пріоритет AI';

  return [`📋 <b>Ліди без пропозиції</b> (останні ${rows.length}). Натисніть /lead_ID, щоб відкрити картку.`, legend, '', ...lines].join('\n');
}

export async function leadCard(odoo: OdooClient, odooUrl: string, id: number): Promise<Notification | undefined> {
  const [lead] = await odoo.call<LeadRow[]>('crm.lead', 'search_read', { domain: [['id', '=', id]], fields: [...LEAD_FIELDS, 'stage_id', 'user_id'] });
  if (lead === undefined) return undefined;

  const taken = isTaken(lead, await firstStageId(odoo));

  return leadNotification(lead, odooUrl, `📇 <b>Лід #${lead.id}</b>`, taken);
}

async function newLeads(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const rows = await odoo.call<LeadRow[]>('crm.lead', 'search_read', {
    domain: [['id', '>', state.lastLeadId], ['x_ai_status', '!=', 'pending']],
    fields: LEAD_FIELDS,
    order: 'id',
  });
  state.lastLeadId = maxId(rows, state.lastLeadId);

  return rows.map((lead) => leadNotification(lead, odooUrl, '🆕 <b>Новий лід</b>'));
}

function leadNotification(lead: LeadRow, odooUrl: string, title: string, taken = false): Notification {
  const budget = lead.x_ai_budget_usd ? `$${lead.x_ai_budget_usd}` : 'не вказано';
  const lines = [
    `${title}: ${escapeHtml(lead.name)}`,
    ...(lead.stage_id ? [`${taken ? '🟢 В роботі' : '🆕 Нова'} · етап: ${escapeHtml(lead.stage_id[1])} · менеджер: ${escapeHtml(lead.user_id ? lead.user_id[1] : 'не призначено')}`] : []),
    `Пріоритет (AI): ${PRIORITY_LABEL[String(lead.x_ai_priority)] ?? '—'}`,
    `Контакт: ${escapeHtml(lead.contact_name || '—')}, ${escapeHtml(lead.x_city || '—')}, ${lead.x_area_m2 || '—'} м²`,
    `Послуги: ${escapeHtml(serviceLabels(lead.x_ai_services || '') || '—')} · Бюджет: ${budget}`,
    `\n${escapeHtml(lead.x_ai_summary || '')}`,
    `Бракує: ${escapeHtml(missingLabels(lead.x_ai_missing || '') || 'нічого')}`,
    `Далі: ${escapeHtml(lead.x_ai_next_action || '—')}`,
  ];
  const keyboard = new InlineKeyboard();
  if (taken === false) keyboard.text('✅ Взяти в роботу', `lead:take:${lead.id}`);
  keyboard
    .text('✉️ Чернетка відповіді', `lead:reply:${lead.id}`)
    .row()
    .text('📄 Створити пропозицію', `lead:quote:${lead.id}`)
    .row()
    .url('Відкрити в Odoo', recordUrl(odooUrl, 'crm.lead', lead.id));

  return { text: lines.join('\n'), keyboard };
}

interface ActivityRow {
  id: number;
  res_model: string;
  res_id: number;
  res_name: string | false;
  summary: string | false;
}

async function newActivities(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const rows = await odoo.call<ActivityRow[]>('mail.activity', 'search_read', {
    domain: [['id', '>', state.lastActivityId]],
    fields: ['res_model', 'res_id', 'res_name', 'summary'],
    order: 'id',
  });
  state.lastActivityId = maxId(rows, state.lastActivityId);

  const result: Notification[] = [];
  for (const activity of rows) {
    const summary = String(activity.summary || '');
    const link = new InlineKeyboard().url('Відкрити в Odoo', recordUrl(odooUrl, activity.res_model, activity.res_id));

    if (summary.startsWith('Прострочено')) {
      const keyboard = new InlineKeyboard()
        .text('⏩ +3 дні', `task:shift:${activity.res_id}`)
        .text('✅ Готово', `task:done:${activity.res_id}`)
        .row()
        .url('Відкрити в Odoo', recordUrl(odooUrl, 'project.task', activity.res_id));
      result.push({ text: `⏰ <b>${escapeHtml(summary)}</b>\n${escapeHtml(activity.res_name)}`, keyboard });
      continue;
    }

    if (summary.startsWith('Передоплату отримано') || summary.startsWith('Тести пройдено')) {
      result.push({ text: `💬 <b>${escapeHtml(summary)}</b>\n${escapeHtml(activity.res_name)}`, keyboard: link });
    }
  }

  return result;
}

interface MessageRow {
  id: number;
  model: string;
  res_id: number;
  record_name: string | false;
  body: string;
}

async function newMessages(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const rows = await odoo.call<MessageRow[]>('mail.message', 'search_read', {
    domain: [['id', '>', state.lastMessageId], '|', ['body', 'ilike', 'Здача заблокована'], ['body', 'ilike', 'AI-чернетку специфікації']],
    fields: ['model', 'res_id', 'record_name', 'body'],
    order: 'id',
  });
  state.lastMessageId = maxId(rows, state.lastMessageId);

  return rows.map((message) => {
    const body = stripHtml(message.body);
    const link = recordUrl(odooUrl, message.model, message.res_id);

    if (body.includes('Здача заблокована')) {
      return { text: `⛔ <b>Здача заблокована</b>\n${escapeHtml(message.record_name)}\n${escapeHtml(body)}`, keyboard: new InlineKeyboard().url('Відкрити в Odoo', link) };
    }

    const keyboard = new InlineKeyboard().text('✅ Погодити специфікацію', `spec:approve:${message.res_id}`).row().url('Перевірити в Odoo', link);

    return { text: `📐 <b>AI-чернетка специфікації готова</b>\n${escapeHtml(message.record_name)}\nПеревірте позиції перед погодженням: після нього створяться RFQ.`, keyboard };
  });
}

interface TicketRow {
  id: number;
  name: string;
  priority: string;
  partner_name: string | false;
}

async function criticalTickets(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const rows = await odoo.call<TicketRow[]>('helpdesk.ticket', 'search_read', {
    domain: [['id', '>', state.lastTicketId]],
    fields: ['name', 'priority', 'partner_name'],
    order: 'id',
  });
  state.lastTicketId = maxId(rows, state.lastTicketId);

  return rows
    .filter((ticket) => ticket.priority === '3')
    .map((ticket) => ({
      text: `🚨 <b>Критичний сервісний тікет #${ticket.id}</b>\n${escapeHtml(ticket.name)}\nКлієнт: ${escapeHtml(ticket.partner_name || '—')}`,
      keyboard: new InlineKeyboard().text('🙋 Беру', `ticket:take:${ticket.id}`).row().url('Відкрити в Odoo', recordUrl(odooUrl, 'helpdesk.ticket', ticket.id)),
    }));
}

interface RfqRow {
  id: number;
  name: string;
  origin: string | false;
  amount_total: number;
  partner_id: [number, string];
}

async function draftRfqs(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const rows = await odoo.call<RfqRow[]>('purchase.order', 'search_read', {
    domain: [['id', '>', state.lastRfqId], ['state', '=', 'draft']],
    fields: ['name', 'origin', 'amount_total', 'partner_id'],
    order: 'id',
  });
  state.lastRfqId = maxId(rows, state.lastRfqId);

  return rows.map((rfq) => ({
    text: `🛒 <b>Чернетка закупівлі ${escapeHtml(rfq.name)}</b>\nПостачальник: ${escapeHtml(rfq.partner_id[1])}\nДжерело: ${escapeHtml(rfq.origin || '—')} · Сума: ${rfq.amount_total} грн`,
    keyboard: new InlineKeyboard().text('✅ Підтвердити замовлення', `rfq:confirm:${rfq.id}`).row().url('Перевірити в Odoo', recordUrl(odooUrl, 'purchase.order', rfq.id)),
  }));
}

export async function collectEvents(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const result: Notification[] = [];

  // Sequential on purpose: Odoo Online rate-limits parallel API calls (HTTP 429).
  result.push(...(await newLeads(odoo, state, odooUrl)));
  result.push(...(await newActivities(odoo, state, odooUrl)));
  result.push(...(await newMessages(odoo, state, odooUrl)));
  result.push(...(await criticalTickets(odoo, state, odooUrl)));
  result.push(...(await draftRfqs(odoo, state, odooUrl)));

  return result;
}

export async function currentCursors(odoo: OdooClient): Promise<Omit<BotState, 'lastDigestDate' | 'approvedChatIds'>> {
  const last = async (model: string) => {
    const [row] = await odoo.call<Array<{ id: number }>>(model, 'search_read', { domain: [], fields: ['id'], order: 'id desc', limit: 1 });

    return row?.id ?? 0;
  };

  return {
    lastLeadId: await last('crm.lead'),
    lastActivityId: await last('mail.activity'),
    lastMessageId: await last('mail.message'),
    lastTicketId: await last('helpdesk.ticket'),
    lastRfqId: await last('purchase.order'),
  };
}
