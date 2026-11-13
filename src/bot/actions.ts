import type { OdooClient } from '../odoo-client.js';
import { InlineKeyboard } from 'grammy';
import { QUOTATION_TEMPLATE_NAME } from '../config/sales-catalog.js';
import { CONSULTATION_NAME } from '../config/appointment.js';
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
  if (stageId === undefined) throw new Error(`stage «${name}» not found`);

  return stageId;
};

async function takeLead(ctx: ActionContext, id: number): Promise<string> {
  const [lead] = await ctx.odoo.searchRead<{ name: string; stage_id: [number, string] | false }>('crm.lead', [['id', '=', id]], ['name', 'stage_id']);
  if (lead === undefined) return 'Lead not found.';

  const stages = await ctx.odoo.call<Array<{ id: number; name: string }>>('crm.stage', 'search_read', { domain: [], fields: ['name'], order: 'sequence, id' });
  const currentIndex = stages.findIndex((stage) => lead.stage_id && stage.id === lead.stage_id[0]);
  if (currentIndex > 0) return `Lead «${escapeHtml(lead.name)}» is already in progress (stage: ${escapeHtml(stages[currentIndex]?.name)}).`;

  const next = stages[currentIndex + 1];
  const values: Record<string, unknown> = { user_id: ctx.odooUserId };
  if (next) values.stage_id = next.id;

  await ctx.odoo.write('crm.lead', [id], values);
  await note(ctx.odoo, 'crm.lead', id, `Taken via Telegram (${ctx.actor}).`);

  return `✅ Lead «${escapeHtml(lead.name)}» taken${next ? `, stage: ${escapeHtml(next.name)}` : ''}.`;
}

async function replyDraft(ctx: ActionContext, id: number): Promise<string> {
  const [lead] = await ctx.odoo.searchRead<{ x_ai_reply_draft: string | false }>('crm.lead', [['id', '=', id]], ['x_ai_reply_draft']);
  if (lead === undefined || lead.x_ai_reply_draft === false) return 'No reply draft.';

  return `✉️ <b>AI reply draft</b> (check it before sending; tap the block to copy):\n\n<pre>${escapeHtml(lead.x_ai_reply_draft)}</pre>`;
}

// Draft only: the manager sends the booking link himself; an activity reminds to check the booking.
async function consultationDraft(ctx: ActionContext, id: number): Promise<ActionResult> {
  const [lead] = await ctx.odoo.searchRead<{ name: string; contact_name: string | false }>('crm.lead', [['id', '=', id]], ['name', 'contact_name']);
  if (lead === undefined) return { text: 'Lead not found.' };

  const [appointment] = await ctx.odoo.searchRead<{ website_url: string | false }>('appointment.type', [['name', '=', CONSULTATION_NAME]], ['website_url']);
  if (appointment === undefined || appointment.website_url === false) return { text: 'Booking type is not set up: run npm run seed:appointment.' };

  const link = `${ctx.odooUrl}${appointment.website_url}`;
  const greeting = lead.contact_name ? `Hello ${lead.contact_name}!` : 'Hello!';
  const message = `${greeting} Thank you for your request. Please choose a convenient time for a free one-hour consultation with an engineer: ${link}`;

  await ctx.odoo.call('crm.lead', 'activity_schedule', {
    ids: [id],
    act_type_xmlid: 'mail.mail_activity_data_todo',
    summary: 'Check the consultation booking',
    note: `Booking link sent to the client (${ctx.actor}).`,
    user_id: ctx.odooUserId,
  });

  // The link is also a button: inside the copy block it is plain text and easy to miss.
  const keyboard = new InlineKeyboard()
    .url('🔗 Booking page', link)
    .row()
    .url('Open in Odoo', recordUrl(ctx.odooUrl, 'crm.lead', id));

  return {
    text: `📅 <b>Consultation invitation</b> (send it to the client yourself; tap the block to copy):\n\n<pre>${escapeHtml(message)}</pre>\nThe lead got an activity «Check the consultation booking».`,
    keyboard,
  };
}

async function shiftTask(ctx: ActionContext, id: number): Promise<string> {
  const [task] = await ctx.odoo.searchRead<{ name: string; date_deadline: string | false }>('project.task', [['id', '=', id]], ['name', 'date_deadline']);
  if (task === undefined) return 'Task not found.';

  const base = task.date_deadline ? new Date(`${task.date_deadline.replace(' ', 'T')}Z`) : new Date();
  const shifted = new Date(base.getTime() + 3 * 24 * 3600 * 1000);
  const deadline = shifted.toISOString().slice(0, 19).replace('T', ' ');

  await ctx.odoo.write('project.task', [id], { date_deadline: deadline });
  await note(ctx.odoo, 'project.task', id, `Deadline moved by +3 days via Telegram (${ctx.actor}).`);

  return `⏩ «${escapeHtml(task.name)}»: new deadline ${deadline.slice(0, 10)}.`;
}

async function completeTask(ctx: ActionContext, id: number): Promise<string> {
  const [task] = await ctx.odoo.searchRead<{ name: string; project_id: [number, string] }>('project.task', [['id', '=', id]], ['name', 'project_id']);
  if (task === undefined) return 'Task not found.';

  await ctx.odoo.write('project.task', [id], { stage_id: await projectStage(ctx.odoo, task.project_id[0], 'Done') });
  await note(ctx.odoo, 'project.task', id, `Marked done via Telegram (${ctx.actor}).`);

  return `✅ «${escapeHtml(task.name)}» → Done.`;
}

async function takeTicket(ctx: ActionContext, id: number): Promise<string> {
  await ctx.odoo.write('helpdesk.ticket', [id], { user_id: ctx.odooUserId });
  await note(ctx.odoo, 'helpdesk.ticket', id, `Taken via Telegram (${ctx.actor}).`);

  return `🙋 Ticket #${id} is assigned to you.`;
}

async function approveSpec(ctx: ActionContext, designTaskId: number): Promise<string> {
  const [design] = await ctx.odoo.searchRead<{ project_id: [number, string] }>('project.task', [['id', '=', designTaskId]], ['project_id']);
  if (design === undefined) return 'Design task not found.';

  const projectId = design.project_id[0];
  const [approval] = await ctx.odoo.search('project.task', [['project_id', '=', projectId], ['name', '=', 'Specification approval with client']]);
  if (approval === undefined) return 'Approval task not found.';

  await ctx.odoo.write('project.task', [approval], { stage_id: await projectStage(ctx.odoo, projectId, 'Done') });
  await note(ctx.odoo, 'project.task', approval, `Specification approved via Telegram (${ctx.actor}).`);

  return `✅ Specification approved for «${escapeHtml(design.project_id[1])}». Draft RFQs created; they will arrive as separate messages.`;
}

async function confirmRfq(ctx: ActionContext, id: number): Promise<string> {
  await ctx.odoo.call('purchase.order', 'button_confirm', { ids: [id] });
  await note(ctx.odoo, 'purchase.order', id, `Confirmed via Telegram (${ctx.actor}). Nothing was sent to the vendor automatically.`);

  return `✅ Purchase confirmed. Send the order to the vendor from Odoo.`;
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
  if (lead === undefined) return { text: 'Lead not found.' };

  const existing = await ctx.odoo.searchRead<{ id: number; name: string }>('sale.order', [['opportunity_id', '=', leadId], ['state', '!=', 'cancel']], ['name']);
  const [first] = existing;
  if (first !== undefined) return { text: `A quotation already exists: ${escapeHtml(first.name)}.`, keyboard: orderKeyboard(ctx, first.id) };

  let partnerId = lead.partner_id ? lead.partner_id[0] : undefined;
  if (partnerId === undefined) {
    partnerId = await ctx.odoo.create('res.partner', { name: lead.contact_name || lead.name, email: lead.email_from || false, phone: lead.phone || false });
    await ctx.odoo.write('crm.lead', [leadId], { partner_id: partnerId });
  }

  const [templateId] = await ctx.odoo.search('sale.order.template', [['name', '=', QUOTATION_TEMPLATE_NAME]]);
  if (templateId === undefined) return { text: 'Quotation template not found (seed:sales).' };

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
  await note(ctx.odoo, 'sale.order', orderId, `Draft quotation created via Telegram (${ctx.actor}). Nothing was sent to the client.`);

  const [order] = await ctx.odoo.searchRead<{ name: string; amount_total: number }>('sale.order', [['id', '=', orderId]], ['name', 'amount_total']);

  return {
    text: `📄 Draft quotation <b>${escapeHtml(order?.name)}</b> for UAH ${order?.amount_total ?? 0} from the template (demo prices). Review it in Odoo before confirming.`,
    keyboard: orderKeyboard(ctx, orderId),
  };
}

function orderKeyboard(ctx: ActionContext, orderId: number): InlineKeyboard {
  return new InlineKeyboard()
    .text('✅ Confirm order', `order:confirm:${orderId}`)
    .row()
    .url('Review in Odoo', recordUrl(ctx.odooUrl, 'sale.order', orderId));
}

async function confirmOrder(ctx: ActionContext, orderId: number): Promise<ActionResult> {
  const [before] = await ctx.odoo.searchRead<{ name: string; state: string }>('sale.order', [['id', '=', orderId]], ['name', 'state']);
  if (before === undefined) return { text: 'Order not found.' };
  if (before.state === 'sale') return { text: `${escapeHtml(before.name)} is already confirmed.` };

  await ctx.odoo.call('sale.order', 'action_confirm', { ids: [orderId] });
  await note(ctx.odoo, 'sale.order', orderId, `Confirmed via Telegram (${ctx.actor}).`);

  const [order] = await ctx.odoo.searchRead<{ name: string; project_ids: number[]; invoice_ids: number[] }>('sale.order', [['id', '=', orderId]], ['name', 'project_ids', 'invoice_ids']);
  const projectId = order?.project_ids[0];
  const keyboard = new InlineKeyboard().url('Order', recordUrl(ctx.odooUrl, 'sale.order', orderId));
  if (projectId !== undefined) keyboard.url('Project', recordUrl(ctx.odooUrl, 'project.project', projectId));

  return {
    text: `✅ <b>${escapeHtml(order?.name)}</b> confirmed: a project with tasks and a draft 30% prepayment invoice were created (${order?.invoice_ids.length ?? 0} invoice). The manager sends the contract and the invoice.`,
    keyboard,
  };
}

// Every reply after a change carries a link to the changed record in Odoo.
const asResult =
  (handler: (ctx: ActionContext, id: number) => Promise<string>, model: string) =>
  async (ctx: ActionContext, id: number): Promise<ActionResult> => ({
    text: await handler(ctx, id),
    keyboard: new InlineKeyboard().url('Open in Odoo', recordUrl(ctx.odooUrl, model, id)),
  });

const HANDLERS: Record<string, (ctx: ActionContext, id: number) => Promise<ActionResult>> = {
  'lead:take': async (ctx, id) => ({
    text: await takeLead(ctx, id),
    keyboard: new InlineKeyboard().text('📄 Create quotation', `lead:quote:${id}`).row().url('Open in Odoo', recordUrl(ctx.odooUrl, 'crm.lead', id)),
  }),
  'lead:reply': asResult(replyDraft, 'crm.lead'),
  'lead:consult': consultationDraft,
  'task:shift': asResult(shiftTask, 'project.task'),
  'task:done': asResult(completeTask, 'project.task'),
  'ticket:take': asResult(takeTicket, 'helpdesk.ticket'),
  'spec:approve': asResult(approveSpec, 'project.task'),
  'rfq:confirm': asResult(confirmRfq, 'purchase.order'),
  'lead:quote': createQuotation,
  'order:confirm': confirmOrder,
};

export async function runAction(ctx: ActionContext, data: string): Promise<ActionResult> {
  const separator = data.lastIndexOf(':');
  const handler = HANDLERS[data.slice(0, separator)];
  const id = Number(data.slice(separator + 1));
  if (handler === undefined || !Number.isInteger(id)) return { text: 'Unknown action.' };

  return handler(ctx, id);
}
