import type { OdooClient } from '../odoo-client.js';
import { escapeHtml } from './format.js';

// Button handlers. Each one does one explicit change a person asked for and leaves a note in Odoo.
export interface ActionContext {
  odoo: OdooClient;
  odooUserId: number;
  actor: string;
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

const HANDLERS: Record<string, (ctx: ActionContext, id: number) => Promise<string>> = {
  'lead:take': takeLead,
  'lead:reply': replyDraft,
  'task:shift': shiftTask,
  'task:done': completeTask,
  'ticket:take': takeTicket,
  'spec:approve': approveSpec,
  'rfq:confirm': confirmRfq,
};

export async function runAction(ctx: ActionContext, data: string): Promise<string> {
  const separator = data.lastIndexOf(':');
  const handler = HANDLERS[data.slice(0, separator)];
  const id = Number(data.slice(separator + 1));
  if (handler === undefined || !Number.isInteger(id)) return 'Невідома дія.';

  return handler(ctx, id);
}
