import { InlineKeyboard } from 'grammy';
import type { OdooClient } from '../odoo-client.js';
import { TASK_STAGES, TEMPLATE_TASKS } from '../config/sales-catalog.js';
import { ROLES, type Role } from './roles.js';
import type { BotState } from './state.js';
import type { Notification } from './events.js';
import { escapeHtml, recordUrl } from './format.js';

// Project pipeline: the 9 template tasks are the stages of one object; each stage has an owner role.
// Rules only: statuses come from Odoo task stages, nothing here uses AI.
const STAGE_ROLE: Record<string, Role> = {
  'Уточнення технічних вимог': 'sales',
  'Виїзд на об’єкт': 'engineer',
  'Проєктування': 'engineer',
  'Погодження специфікації з клієнтом': 'sales',
  'Закупівля обладнання': 'procurement',
  'Монтаж': 'pm',
  'Налаштування та програмування': 'engineer',
  'Тестування системи': 'engineer',
  'Здача клієнту та навчання': 'pm',
};

const [TODO, IN_PROGRESS, REVIEW, DONE] = TASK_STAGES as [string, string, string, string];

const STAGE_ICON: Record<string, string> = { [TODO]: '⏳', [IN_PROGRESS]: '🔵', [REVIEW]: '🟣', [DONE]: '✅' };

const MOVES: Record<string, string> = { work: IN_PROGRESS, review: REVIEW, done: DONE };

interface TaskRow {
  id: number;
  name: string;
  project_id: [number, string];
  stage_id: [number, string] | false;
  state: string;
  date_deadline: string | false;
  write_date: string;
  child_ids: number[];
}

const TASK_FIELDS = ['name', 'project_id', 'stage_id', 'state', 'date_deadline', 'write_date', 'child_ids'];

const pipelineDomain = (extra: unknown[][] = []) => [
  ['name', 'in', TEMPLATE_TASKS],
  ['parent_id', '=', false],
  ['project_id.is_template', '=', false],
  ...extra,
];

const stageName = (task: TaskRow): string => (task.stage_id ? task.stage_id[1] : TODO);

const roleLabel = (taskName: string): string => {
  const role = STAGE_ROLE[taskName] ?? 'pm';

  return ROLES.find((item) => item.key === role)?.label ?? role;
};

const orderByTemplate = (tasks: TaskRow[]): TaskRow[] =>
  [...tasks].sort((a, b) => TEMPLATE_TASKS.indexOf(a.name) - TEMPLATE_TASKS.indexOf(b.name));

const currentTask = (tasks: TaskRow[]): TaskRow | undefined => tasks.find((task) => stageName(task) !== DONE);

const isOverdue = (task: TaskRow): boolean =>
  task.date_deadline !== false && stageName(task) !== DONE && new Date(`${task.date_deadline.replace(' ', 'T')}Z`) < new Date();

async function projectTasks(odoo: OdooClient, projectId: number): Promise<TaskRow[]> {
  const rows = await odoo.searchRead<TaskRow>('project.task', pipelineDomain([['project_id', '=', projectId]]), TASK_FIELDS);

  return orderByTemplate(rows);
}

// /projects: one line per object with progress and the stage that is on someone's desk now.
export async function projectsList(odoo: OdooClient, limit = 10): Promise<string> {
  const rows = await odoo.searchRead<TaskRow>('project.task', pipelineDomain(), TASK_FIELDS);
  if (rows.length === 0) return 'Немає активних проєктів.';

  const byProject = new Map<number, TaskRow[]>();
  for (const task of rows) byProject.set(task.project_id[0], [...(byProject.get(task.project_id[0]) ?? []), task]);

  const projectIds = [...byProject.keys()].sort((a, b) => b - a).slice(0, limit);
  const lines = projectIds.map((projectId) => {
    const tasks = orderByTemplate(byProject.get(projectId) ?? []);
    const done = tasks.filter((task) => stageName(task) === DONE).length;
    const current = currentTask(tasks);
    const overdue = tasks.some(isOverdue) ? ' ⏰' : '';
    const name = tasks[0]?.project_id[1] ?? String(projectId);
    const now = current ? `${STAGE_ICON[stageName(current)] ?? '⏳'} ${escapeHtml(current.name)} · ${roleLabel(current.name)}` : '🏁 усі етапи завершено';

    return `/project_${projectId} · ${done}/${tasks.length}${overdue}\n      ${escapeHtml(name.slice(0, 45))}\n      зараз: ${now}`;
  });

  return [`📁 <b>Проєкти</b> (останні ${projectIds.length}). /project_ID — картка з кнопками.`, '', ...lines].join('\n');
}

const checksLine = async (odoo: OdooClient, task: TaskRow): Promise<string> => {
  if (task.child_ids.length === 0) return '';

  const open = await odoo.search('project.task', [['id', 'in', task.child_ids], ['state', 'not in', ['1_done', '1_canceled']]]);

  return ` · перевірок відкрито ${open.length}/${task.child_ids.length}`;
};

// /project_<id>: every stage with status, deadline and owner; buttons only for the current stage.
export async function projectCard(odoo: OdooClient, odooUrl: string, projectId: number): Promise<Notification | undefined> {
  const tasks = await projectTasks(odoo, projectId);
  const [first] = tasks;
  if (first === undefined) return undefined;

  const current = currentTask(tasks);
  const done = tasks.filter((task) => stageName(task) === DONE).length;

  const lines = [`📁 <b>${escapeHtml(first.project_id[1])}</b>`, `Прогрес: ${done}/${tasks.length}`, ''];
  for (const task of tasks) {
    const deadline = task.date_deadline ? ` · до ${task.date_deadline.slice(5, 10).split('-').reverse().join('.')}` : '';
    const overdue = isOverdue(task) ? ' ⏰' : '';
    const waiting = task.state === '04_waiting_normal' ? ' · чекає попередній етап' : '';
    const pointer = task.id === current?.id ? '👉 ' : '';
    const checks = task.id === current?.id ? await checksLine(odoo, task) : '';
    lines.push(`${pointer}${STAGE_ICON[stageName(task)] ?? '⏳'} ${escapeHtml(task.name)} — ${roleLabel(task.name)}${deadline}${overdue}${waiting}${checks}`);
  }

  const keyboard = new InlineKeyboard();
  if (current !== undefined) {
    const stage = stageName(current);
    if (stage !== IN_PROGRESS) keyboard.text('▶ В роботу', `pstage:work:${current.id}`);
    if (stage === IN_PROGRESS) keyboard.text('👀 На перевірку', `pstage:review:${current.id}`);
    keyboard.text('✅ Готово', `pstage:done:${current.id}`).row();
    if (current.child_ids.length > 0) keyboard.text('🧪 Чекліст', `pchk:list:${current.id}`).row();
  }
  keyboard.text('🔄 Оновити', `pcard:open:${projectId}`).url('Відкрити в Odoo', recordUrl(odooUrl, 'project.project', projectId));

  return { text: lines.join('\n'), keyboard };
}

export interface PipelineResult {
  text: string;
  keyboard?: InlineKeyboard;
}

interface PipelineContext {
  odoo: OdooClient;
  odooUrl: string;
  actor: string;
}

const note = (odoo: OdooClient, id: number, body: string) =>
  odoo.call('project.task', 'message_post', { ids: [id], body, message_type: 'comment' });

const readTask = async (odoo: OdooClient, id: number): Promise<TaskRow | undefined> => {
  const [task] = await odoo.searchRead<TaskRow>('project.task', [['id', '=', id]], TASK_FIELDS);

  return task;
};

const withCard = async (ctx: PipelineContext, projectId: number, text: string): Promise<PipelineResult> => {
  const card = await projectCard(ctx.odoo, ctx.odooUrl, projectId);

  return { text: card === undefined ? text : `${text}\n\n${card.text}`, keyboard: card?.keyboard };
};

// Moving a stage is an ordinary Odoo write, so Odoo automations (spec → RFQs, tests gate) still fire.
async function moveStage(ctx: PipelineContext, move: string, taskId: number): Promise<PipelineResult> {
  const target = MOVES[move];
  if (target === undefined) return { text: 'Невідома дія.' };

  const task = await readTask(ctx.odoo, taskId);
  if (task === undefined) return { text: 'Етап не знайдено.' };
  if (task.state === '04_waiting_normal') return { text: `«${escapeHtml(task.name)}» чекає на завершення попереднього етапу.` };

  const [stageId] = await ctx.odoo.search('project.task.type', [['name', '=', target], ['project_ids', 'in', [task.project_id[0]]]]);
  if (stageId === undefined) return { text: `Стадію «${target}» не знайдено в проєкті.` };

  await ctx.odoo.write('project.task', [taskId], { stage_id: stageId });
  await note(ctx.odoo, taskId, `Стадія «${target}» встановлена через Telegram (${ctx.actor}).`);

  return withCard(ctx, task.project_id[0], `${STAGE_ICON[target] ?? ''} «${escapeHtml(task.name)}» → ${target}.`);
}

// Engineer on site: open checks as buttons; closing the last one is still a separate «Готово» decision.
async function checklist(ctx: PipelineContext, taskId: number): Promise<PipelineResult> {
  const task = await readTask(ctx.odoo, taskId);
  if (task === undefined) return { text: 'Етап не знайдено.' };

  const checks = await ctx.odoo.searchRead<{ id: number; name: string; state: string }>('project.task', [['id', 'in', task.child_ids]], ['name', 'state']);
  const open = checks.filter((check) => check.state !== '1_done' && check.state !== '1_canceled');

  const keyboard = new InlineKeyboard();
  for (const check of open.slice(0, 20)) keyboard.text(`✅ ${check.name.replace(/^Перевірка\s*/, '').slice(0, 40)}`, `pchk:done:${check.id}`).row();
  keyboard.text('📁 До проєкту', `pcard:open:${task.project_id[0]}`);

  const header = `🧪 <b>Чекліст: ${escapeHtml(task.name)}</b>\nВідкрито ${open.length} з ${checks.length}. Натисніть перевірку, щоб закрити її.`;
  const tail = open.length === 0 ? '\n\nУсі перевірки закрито: переведіть етап у «Готово» в картці проєкту.' : '';

  return { text: header + tail, keyboard };
}

async function closeCheck(ctx: PipelineContext, checkId: number): Promise<PipelineResult> {
  const [check] = await ctx.odoo.searchRead<{ name: string; parent_id: [number, string] | false }>('project.task', [['id', '=', checkId]], ['name', 'parent_id']);
  if (check === undefined || check.parent_id === false) return { text: 'Перевірку не знайдено.' };

  await ctx.odoo.write('project.task', [checkId], { state: '1_done' });
  await note(ctx.odoo, checkId, `Перевірку закрито через Telegram (${ctx.actor}).`);

  const list = await checklist(ctx, check.parent_id[0]);

  return { text: `✅ ${escapeHtml(check.name.slice(0, 80))}\n\n${list.text}`, keyboard: list.keyboard };
}

export async function runPipelineAction(ctx: PipelineContext, kind: string, action: string, id: number): Promise<PipelineResult> {
  if (kind === 'pstage') return moveStage(ctx, action, id);
  if (kind === 'pchk' && action === 'list') return checklist(ctx, id);
  if (kind === 'pchk' && action === 'done') return closeCheck(ctx, id);

  const card = await projectCard(ctx.odoo, ctx.odooUrl, id);

  return card ?? { text: 'Проєкт не знайдено.' };
}

const cardKeyboard = (odooUrl: string, projectId: number) =>
  new InlineKeyboard().text('📁 Картка проєкту', `pcard:open:${projectId}`).url('Відкрити в Odoo', recordUrl(odooUrl, 'project.project', projectId));

// Stage changes made anywhere (Odoo UI, bot, automations): the owner of the next stage is told it is their turn.
export async function stageChanges(odoo: OdooClient, state: BotState, odooUrl: string): Promise<Notification[]> {
  const isFirstRun = state.lastTaskWrite === '';
  const domain = isFirstRun ? pipelineDomain() : pipelineDomain([['write_date', '>=', state.lastTaskWrite]]);
  const rows = await odoo.searchRead<TaskRow>('project.task', domain, TASK_FIELDS);

  const result: Notification[] = [];
  for (const task of rows) {
    const key = String(task.id);
    const previous = state.taskStages[key];
    const current = stageName(task);
    state.taskStages[key] = current;
    if (task.write_date > state.lastTaskWrite) state.lastTaskWrite = task.write_date;
    if (isFirstRun || previous === current) continue;
    if (previous === undefined && current === TODO) continue;

    result.push(...(await transitionNotices(odoo, odooUrl, task, current)));
  }

  return result;
}

async function transitionNotices(odoo: OdooClient, odooUrl: string, task: TaskRow, current: string): Promise<Notification[]> {
  const projectId = task.project_id[0];
  const project = escapeHtml(task.project_id[1]);
  const keyboard = cardKeyboard(odooUrl, projectId);
  const changed: Notification = {
    text: `${STAGE_ICON[current] ?? '🔁'} <b>${escapeHtml(task.name)}</b> → ${current}\n${project}`,
    keyboard,
    role: 'pm',
  };
  if (current !== DONE) return [changed];

  const next = currentTask(await projectTasks(odoo, projectId));
  if (next === undefined) return [{ ...changed, text: `🏁 <b>Усі етапи завершено</b>\n${project}` }];

  const nextRole = STAGE_ROLE[next.name] ?? 'pm';
  const handoff: Notification = {
    text: `👉 <b>Ваша черга: ${escapeHtml(next.name)}</b>\n${project}\nПопередній етап «${escapeHtml(task.name)}» завершено.`,
    keyboard: new InlineKeyboard().text('▶ Взяти в роботу', `pstage:work:${next.id}`).row().text('📁 Картка проєкту', `pcard:open:${projectId}`),
    role: nextRole,
  };

  return nextRole === 'pm' ? [handoff] : [changed, handoff];
}
