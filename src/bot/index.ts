import { Bot } from 'grammy';
import { OdooClient } from '../odoo-client.js';
import { loadConfig } from './config.js';
import { collectEvents, currentCursors, leadCard, leadsList } from './events.js';
import { runAction } from './actions.js';
import { STATS_KEYBOARD, buildDigest, buildStats, isStatsKey } from './stats.js';
import { loadState, saveState, type BotState } from './state.js';
import { createAccess } from './access.js';
import { projectCard, projectsList, runPipelineAction } from './pipeline.js';
import { FLOW_COMMAND, FLOW_TEXT } from './guide.js';
import type { Role } from './roles.js';

const COMMANDS = [
  { command: 'help', description: 'Список команд з поясненнями' },
  FLOW_COMMAND,
  { command: 'leads', description: 'Список лідів без пропозиції (далі /lead_ID — картка з кнопками)' },
  { command: 'projects', description: 'Проєкти по етапах: хто зараз відповідає (далі /project_ID — картка)' },
  { command: 'stats', description: 'Статистика: ліди, кампанії, прострочення, сервіс, воронка' },
  { command: 'digest', description: 'Дайджест зараз (щодня приходить зранку сам)' },
  { command: 'overdue', description: 'Прострочені задачі проєктів' },
  { command: 'whoami', description: 'Ваш chat ID' },
  { command: 'request', description: 'Запросити доступ до бота в адміністратора' },
  { command: 'users', description: 'Адмін: користувачі та їхні ролі' },
];

const HELP = [
  '<b>Gravity × Odoo — демо-бот</b> (неофіційний стенд, синтетичні дані)',
  '',
  ...COMMANDS.map((item) => `/${item.command} — ${item.description}`),
  '',
  '<b>Сповіщення приходять самі:</b>',
  '📋 /leads — список, /lead_ID — картка ліда з кнопками',
  '📁 /projects — етапи об’єктів; /project_ID — статус кожного етапу, кнопки «В роботу / На перевірку / Готово», 🧪 чекліст',
  '👉 «Ваша черга» — коли попередній етап завершено, відповідальний за наступний отримує сповіщення',
  '🆕 новий лід з AI-розбором → «Взяти в роботу», «Чернетка відповіді», «Створити пропозицію»',
  '📄 чернетка пропозиції → «Підтвердити замовлення» (проєкт + рахунок на передоплату)',
  '📐 AI-чернетка специфікації → «Погодити» (створює RFQ)',
  '🛒 чернетка закупівлі → «Підтвердити закупівлю»',
  '👤 новий кандидат з AI-профілем (HR)',
  '⏰ прострочена задача → «+3 дні», «Готово»',
  '⛔ здача заблокована, 💬 передоплату отримано, тести пройдено',
  '🚨 критичний сервісний тікет → «Беру»',
  '',
  'Сповіщення приходять за ролями (продажі, PM, інженер, закупівлі, сервіс, HR); ролі призначає адміністратор у /users.',
  '',
  'Кожна дія з бота залишає запис в Odoo. Бот нічого не надсилає клієнтам і постачальникам.',
].join('\n');

const config = loadConfig();
const odoo = OdooClient.fromEnv();
const bot = new Bot(config.token);
const html = { parse_mode: 'HTML' as const };

// State is loaded before handlers: approved chat IDs live there.
// First start: begin from the current records instead of flooding the chat with history.
const loaded = await loadState();
const cursors = await currentCursors(odoo);

// Cursors missing in an older state file start from the current records (no flood after upgrades).
if (loaded !== undefined && loaded.lastApplicantId === 0) loaded.lastApplicantId = cursors.lastApplicantId;

const state: BotState = loaded ?? {
  ...cursors,
  lastDigestDate: new Date().toISOString().slice(0, 10),
  lastTaskWrite: '',
  taskStages: {},
  users: {},
};

const access = createAccess({ bot, state, adminChatId: config.adminChatId, envChatIds: config.allowedChatIds });
const allowedChats = access.allowedChats;

const DESCRIPTION = [
  'Демо-бот для тестового завдання Gravity × Odoo (неофіційний стенд, усі дані синтетичні).',
  '',
  'Що вміє: нові заявки з AI-розбором, погодження специфікацій і закупівель, прострочені задачі, критичні сервісні тікети, статистика й ранковий дайджест.',
  '',
  'Натисніть Start, а потім /request, щоб попросити доступ.',
].join('\n');

const WELCOME = [
  '👋 <b>Вітаю! Це демо-бот Gravity × Odoo.</b>',
  '',
  'Він показує, як команда може працювати з ERP прямо з Telegram:',
  '• нові заявки з сайту одразу з AI-розбором і кнопкою «Взяти в роботу»;',
  '• погодження специфікацій і закупівель однією кнопкою;',
  '• сигнали про прострочені задачі, блокування здачі, оплати та критичні тікети;',
  '• статистика й ранковий дайджест.',
  '',
  'Це неофіційний демонстраційний стенд, дані синтетичні.',
  'Щоб отримати доступ, надішліть /request — адміністратор підтвердить запит.',
].join('\n');

bot.command('start', (ctx) => ctx.reply(allowedChats().includes(ctx.chat.id) ? HELP : WELCOME, html));

bot.command('whoami', (ctx) => ctx.reply(`Ваш chat ID: <code>${ctx.chat.id}</code>`, html));

access.register();

bot.command('help', (ctx) => ctx.reply(HELP, html));
bot.command('leads', async (ctx) => ctx.reply(await leadsList(odoo), html));

// /lead_61 (clickable in the list) or /lead 61
bot.hears(/^\/lead(?:_|\s+)(\d+)/, async (ctx) => {
  const card = await leadCard(odoo, config.odooUrl, Number(ctx.match[1]));
  if (card === undefined) return ctx.reply('Лід не знайдено.');

  return ctx.reply(card.text, { ...html, reply_markup: card.keyboard });
});

bot.command('flow', (ctx) => ctx.reply(FLOW_TEXT, html));

bot.command('projects', async (ctx) => ctx.reply(await projectsList(odoo), html));

bot.hears(/^\/project(?:_|\s+)(\d+)/, async (ctx) => {
  const card = await projectCard(odoo, config.odooUrl, Number(ctx.match[1]));
  if (card === undefined) return ctx.reply('Проєкт не знайдено.');

  return ctx.reply(card.text, { ...html, reply_markup: card.keyboard });
});

// Registered before the generic handler: pipeline buttons edit nothing but Odoo task stages and checks.
bot.callbackQuery(/^(pcard|pstage|pchk):(\w+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const actor = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

  try {
    const result = await runPipelineAction({ odoo, odooUrl: config.odooUrl, actor }, String(ctx.match[1]), String(ctx.match[2]), Number(ctx.match[3]));
    await ctx.reply(result.text, { ...html, reply_markup: result.keyboard });
  } catch (error) {
    await ctx.reply(`Помилка: ${error instanceof Error ? error.message : String(error)}`);
  }
});

bot.command('stats', (ctx) => ctx.reply('Оберіть звіт:', { reply_markup: STATS_KEYBOARD }));
bot.command('digest', async (ctx) => ctx.reply(await buildDigest(odoo), html));
bot.command('overdue', async (ctx) => ctx.reply(await buildStats(odoo, 'stats:overdue'), html));

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  try {
    const actor = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    if (isStatsKey(data)) {
      await ctx.reply(await buildStats(odoo, data), html);

      return;
    }

    const result = await runAction({ odoo, odooUserId: config.odooUserId, odooUrl: config.odooUrl, actor }, data);
    await ctx.reply(result.text, { ...html, reply_markup: result.keyboard });
  } catch (error) {
    await ctx.reply(`Помилка: ${error instanceof Error ? error.message : String(error)}`);
  }
});

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// One chat that blocked the bot must not stop notifications for the others.
const broadcast = async (text: string, options: Record<string, unknown> = {}, role?: Role) => {
  for (const chatId of access.recipients(role)) {
    try {
      await bot.api.sendMessage(chatId, text, { ...html, ...options });
    } catch (error) {
      console.error(`send to ${chatId} failed:`, errorText(error));
    }
  }
};

bot.catch((error) => {
  console.error(`update ${error.ctx.update.update_id} failed:`, errorText(error.error));
});

const tick = async () => {
  const events = await collectEvents(odoo, state, config.odooUrl);
  for (const event of events) await broadcast(event.text, { reply_markup: event.keyboard }, event.role);

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (now.getHours() >= config.digestHour && state.lastDigestDate !== today) {
    await broadcast(await buildDigest(odoo));
    state.lastDigestDate = today;
  }

  await saveState(state);
};

const main = async () => {
  await saveState(state);
  await bot.api.setMyCommands(COMMANDS);
  await bot.api.setMyDescription(DESCRIPTION);
  await bot.api.setMyShortDescription('Демо: Odoo + AI для smart home компанії. Ліди, погодження, статистика.');

  let running = false;
  setInterval(() => {
    if (running) return;

    running = true;
    tick()
      .catch((error: unknown) => console.error('poll failed:', errorText(error)))
      .finally(() => {
        running = false;
      });
  }, config.pollSeconds * 1000);

  console.log(`bot started, admin ${config.adminChatId}, allowed chats: ${allowedChats().join(', ')}, poll ${config.pollSeconds}s`);
  await bot.start();
};

await main();
