import type { OdooClient } from '../odoo-client.js';
import { InlineKeyboard } from 'grammy';
import { QUOTATION_TEMPLATE_NAME } from '../config/sales-catalog.js';
import { escapeHtml, recordUrl } from './format.js';

// Button handlers. Each one does one explicit change a person asked for and leaves a note in Odoo.
export interface ActionContext {
  odoo: OdooClient;
  odooUserId: number;
  odooUrl: string;
  actor: string;
}

export interface ActionResult {
  text: string;
  keyboard?: InlineKeyboard;
}

const note = (odoo: OdooClient, model: string, id: number, text: string) =>
  odoo.call(model, 'message_post', { ids: [id], body: text, message_type: 'comment' });

const projectStage = async (odoo: OdooClient, projectId: number, name: string): Promise<number> => {
  const [stageId] = await odoo.search('project.task.type', [['name', '=', name], ['project_ids', 'in', [projectId]]]);
  if (stageId === undefined) throw new Error(`етап «${name}» не знайдено`);

  return stageId;
};

async function takeLead(ctx: ActionContext, id: number): Promise<string> {
  const [lead] = await ctx.odoo.searchRead<{ name: string; stage_id: [number, string] | false }>('crm.lead', [['id', '=', id]], ['name', 'stage_id']);
  if (lead === undefined) return 'Лід не знайдено.';

  const stages = await ctx.odoo.call<Array<{ id: number; name: string }>>('crm.stage', 'search_read', { domain: [], fields: ['name'], order: 'sequence, id' });
  const currentIndex = stages.findIndex((stage) => lead.stage_id && stage.id === lead.stage_id[0]);
  const next = stages[currentIndex + 1];
  const values: Record<string, unknown> = { user_id: ctx.odooUserId };
  if (next) values.stage_id = next.id;

  await ctx.odoo.write('crm.lead', [id], values);
  await note(ctx.odoo, 'crm.lead', id, `Взято в роботу через Telegram (${ctx.actor}).`);

  return `✅ Лід «${escapeHtml(lead.name)}» взято в роботу${next ? `, етап: ${escapeHtml(next.name)}` : ''}.`;
}

async function replyDraft(ctx: ActionContext, id: number): Promise<string> {
  const [lead] = await ctx.odoo.searchRead<{ x_ai_reply_draft: string | false }>('crm.lead', [['id', '=', id]], ['x_ai_reply_draft']);
  if (lead === undefined || lead.x_ai_reply_draft === false) return 'Чернетки відповіді немає.';

  return `✉️ <b>AI-чернетка відповіді</b> (перевірте перед надсиланням, натисніть на блок, щоб скопіювати):\n\n<pre>${escapeHtml(lead.x_ai_reply_draft)}</pre>`;
}

async function shiftTask(ctx: ActionContext, id: number): Promise<string> {
  const [task] = await ctx.odoo.searchRead<{ name: string; date_deadline: string | false }>('project.task', [['id', '=', id]], ['name', 'date_deadline']);
  if (task === undefined) return 'Задачу не знайдено.';

  const base = task.date_deadline ? new Date(`${task.date_deadline.replace(' ', 'T')}Z`) : new Date();
  const shifted = new Date(base.getTime() + 3 * 24 * 3600 * 1000);
  const deadline = shifted.toISOString().slice(0, 19).replace('T', ' ');

  await ctx.odoo.write('project.task', [id], { date_deadline: deadline });
  await note(ctx.odoo, 'project.task', id, `Дедлайн перенесено на +3 дні через Telegram (${ctx.actor}).`);

  return `⏩ «${escapeHtml(task.name)}»: новий дедлайн ${deadline.slice(0, 10)}.`;
}

async function completeTask(ctx: ActionContext, id: number): Promise<string> {
  const [task] = await ctx.odoo.searchRead<{ name: string; project_id: [number, string] }>('project.task', [['id', '=', id]], ['name', 'project_id']);
  if (task === undefined) return 'Задачу не знайдено.';

  await ctx.odoo.write('project.task', [id], { stage_id: await projectStage(ctx.odoo, task.project_id[0], 'Готово') });
  await note(ctx.odoo, 'project.task', id, `Позначено як виконане через Telegram (${ctx.actor}).`);

  return `✅ «${escapeHtml(task.name)}» → Готово.`;
}

async function takeTicket(ctx: ActionContext, id: number): Promise<string> {
  await ctx.odoo.write('helpdesk.ticket', [id], { user_id: ctx.odooUserId });
  await note(ctx.odoo, 'helpdesk.ticket', id, `Взято в роботу через Telegram (${ctx.actor}).`);

  return `🙋 Тікет #${id} закріплено за вами.`;
}

async function approveSpec(ctx: ActionContext, designTaskId: number): Promise<string> {
  const [design] = await ctx.odoo.searchRead<{ project_id: [number, string] }>('project.task', [['id', '=', designTaskId]], ['project_id']);
  if (design === undefined) return 'Задачу проєктування не знайдено.';

  const projectId = design.project_id[0];
  const [approval] = await ctx.odoo.search('project.task', [['project_id', '=', projectId], ['name', '=', 'Погодження специфікації з клієнтом']]);
  if (approval === undefined) return 'Задачу погодження не знайдено.';

  await ctx.odoo.write('project.task', [approval], { stage_id: await projectStage(ctx.odoo, projectId, 'Готово') });
  await note(ctx.odoo, 'project.task', approval, `Специфікацію погоджено через Telegram (${ctx.actor}).`);

  return `✅ Специфікацію погоджено для «${escapeHtml(design.project_id[1])}». Чернетки RFQ створено, вони прийдуть окремими повідомленнями.`;
}

async function confirmRfq(ctx: ActionContext, id: number): Promise<string> {
  await ctx.odoo.call('purchase.order', 'button_confirm', { ids: [id] });
  await note(ctx.odoo, 'purchase.order', id, `Підтверджено через Telegram (${ctx.actor}). Постачальнику нічого не надіслано автоматично.`);

  return `✅ Закупівлю підтверджено. Надішліть замовлення постачальнику з Odoo.`;
}


interface LeadContact {
  name: string;
  partner_id: [number, string] | false;
  contact_name: string | false;
  email_from: string | false;
  phone: string | false;
}

async function createQuotation(ctx: ActionContext, leadId: number): Promise<ActionResult> {
  const [lead] = await ctx.odoo.searchRead<LeadContact>('crm.lead', [['id', '=', leadId]], ['name', 'partner_id', 'contact_name', 'email_from', 'phone']);
  if (lead === undefined) return { text: 'Лід не знайдено.' };

  const existing = await ctx.odoo.searchRead<{ id: number; name: string }>('sale.order', [['opportunity_id', '=', leadId], ['state', '!=', 'cancel']], ['name']);
  const [first] = existing;
  if (first !== undefined) return { text: `Пропозиція вже є: ${escapeHtml(first.name)}.`, keyboard: orderKeyboard(ctx, first.id) };

  let partnerId = lead.partner_id ? lead.partner_id[0] : undefined;
  if (partnerId === undefined) {
    partnerId = await ctx.odoo.create('res.partner', { name: lead.contact_name || lead.name, email: lead.email_from || false, phone: lead.phone || false });
    await ctx.odoo.write('crm.lead', [leadId], { partner_id: partnerId });
  }

  const [templateId] = await ctx.odoo.search('sale.order.template', [['name', '=', QUOTATION_TEMPLATE_NAME]]);
  if (templateId === undefined) return { text: 'Шаблон пропозиції не знайдено (seed:sales).' };

  const templateLines = await ctx.odoo.searchRead<{ product_id: [number, string]; product_uom_qty: number }>(
    'sale.order.template.line',
    [['sale_order_template_id', '=', templateId], ['product_id', '!=', false]],
    ['product_id', 'product_uom_qty'],
  );
  const orderLines = templateLines.map((line) => [0, 0, { product_id: line.product_id[0], product_uom_qty: line.product_uom_qty }]);
  const orderId = await ctx.odoo.create('sale.order', {
    partner_id: partnerId,
    opportunity_id: leadId,
    sale_order_template_id: templateId,
    user_id: ctx.odooUserId,
    order_line: orderLines,
  });
  await note(ctx.odoo, 'sale.order', orderId, `Чернетку пропозиції створено через Telegram (${ctx.actor}). Клієнту нічого не надіслано.`);

  const [order] = await ctx.odoo.searchRead<{ name: string; amount_total: number }>('sale.order', [['id', '=', orderId]], ['name', 'amount_total']);

  return {
    text: `📄 Чернетка пропозиції <b>${escapeHtml(order?.name)}</b> на ${order?.amount_total ?? 0} грн з шаблону (демо-ціни). Перевірте її в Odoo перед підтвердженням.`,
    keyboard: orderKeyboard(ctx, orderId),
  };
}

function orderKeyboard(ctx: ActionContext, orderId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Підтвердити замовлення', `order:confirm:${orderId}`)
    .row()
    .url('Перевірити в Odoo', recordUrl(ctx.odooUrl, 'sale.order', orderId));
}

async function confirmOrder(ctx: ActionContext, orderId: number): Promise<ActionResult> {
  const [before] = await ctx.odoo.searchRead<{ name: string; state: string }>('sale.order', [['id', '=', orderId]], ['name', 'state']);
  if (before === undefined) return { text: 'Замовлення не знайдено.' };
  if (before.state === 'sale') return { text: `${escapeHtml(before.name)} уже підтверджено.` };

  await ctx.odoo.call('sale.order', 'action_confirm', { ids: [orderId] });
  await note(ctx.odoo, 'sale.order', orderId, `Підтверджено через Telegram (${ctx.actor}).`);

  const [order] = await ctx.odoo.searchRead<{ name: string; project_ids: number[]; invoice_ids: number[] }>('sale.order', [['id', '=', orderId]], ['name', 'project_ids', 'invoice_ids']);
  const projectId = order?.project_ids[0];
  const keyboard = new InlineKeyboard().url('Замовлення', recordUrl(ctx.odooUrl, 'sale.order', orderId));
  if (projectId !== undefined) keyboard.url('Проєкт', recordUrl(ctx.odooUrl, 'project.project', projectId));

  return {
    text: `✅ <b>${escapeHtml(order?.name)}</b> підтверджено: створено проєкт із задачами та чернетку рахунку на передоплату 30% (${order?.invoice_ids.length ?? 0} рахунок). Договір і рахунок надсилає менеджер.`,
    keyboard,
  };
}

const asResult = (handler: (ctx: ActionContext, id: number) => Promise<string>) => async (ctx: ActionContext, id: number): Promise<ActionResult> => ({
  text: await handler(ctx, id),
});

const HANDLERS: Record<string, (ctx: ActionContext, id: number) => Promise<ActionResult>> = {
  'lead:take': async (ctx, id) => ({
    text: await takeLead(ctx, id),
    keyboard: new InlineKeyboard().text('📄 Створити пропозицію', `lead:quote:${id}`),
  }),
  'lead:reply': asResult(replyDraft),
  'task:shift': asResult(shiftTask),
  'task:done': asResult(completeTask),
  'ticket:take': asResult(takeTicket),
  'spec:approve': asResult(approveSpec),
  'rfq:confirm': asResult(confirmRfq),
  'lead:quote': createQuotation,
  'order:confirm': confirmOrder,
};

export async function runAction(ctx: ActionContext, data: string): Promise<ActionResult> {
  const separator = data.lastIndexOf(':');
  const handler = HANDLERS[data.slice(0, separator)];
  const id = Number(data.slice(separator + 1));
  if (handler === undefined || !Number.isInteger(id)) return { text: 'Невідома дія.' };

  return handler(ctx, id);
}
