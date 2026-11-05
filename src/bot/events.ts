import { InlineKeyboard } from 'grammy';
import type { OdooClient } from '../odoo-client.js';
import type { BotState } from './state.js';
import { PRIORITY_LABEL, escapeHtml, recordUrl, stripHtml } from './format.js';

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
}

const maxId = (rows: Array<{ id: number }>, current: number) => rows.reduce((max, row) => Math.max(max, row.id), current);

async function newLeads(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const rows = await odoo.call<LeadRow[]>('crm.lead', 'search_read', {
    domain: [['id', '>', state.lastLeadId], ['x_ai_status', '!=', 'pending']],
    fields: ['name', 'contact_name', 'x_city', 'x_area_m2', 'x_ai_priority', 'x_ai_services', 'x_ai_budget_usd', 'x_ai_summary', 'x_ai_missing', 'x_ai_next_action'],
    order: 'id',
  });
  state.lastLeadId = maxId(rows, state.lastLeadId);

  return rows.map((lead) => {
    const budget = lead.x_ai_budget_usd ? `$${lead.x_ai_budget_usd}` : 'не вказано';
    const lines = [
      `🆕 <b>Новий лід</b>: ${escapeHtml(lead.name)}`,
      `Пріоритет (AI): ${PRIORITY_LABEL[String(lead.x_ai_priority)] ?? '—'}`,
      `Контакт: ${escapeHtml(lead.contact_name || '—')}, ${escapeHtml(lead.x_city || '—')}, ${lead.x_area_m2 || '—'} м²`,
      `Послуги: ${escapeHtml(lead.x_ai_services || '—')} · Бюджет: ${budget}`,
      `\n${escapeHtml(lead.x_ai_summary || '')}`,
      `Бракує: ${escapeHtml(lead.x_ai_missing || 'нічого')}`,
      `Далі: ${escapeHtml(lead.x_ai_next_action || '—')}`,
    ];
    const keyboard = new InlineKeyboard()
      .text('✅ Взяти в роботу', `lead:take:${lead.id}`)
      .text('✉️ Чернетка відповіді', `lead:reply:${lead.id}`)
      .row()
      .url('Відкрити в Odoo', recordUrl(odooUrl, 'crm.lead', lead.id));

    return { text: lines.join('\n'), keyboard };
  });
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

export async function currentCursors(odoo: OdooClient): Promise<Omit<BotState, 'lastDigestDate'>> {
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
