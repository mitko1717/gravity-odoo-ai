import { Bot, InlineKeyboard } from 'grammy';
import { OdooClient } from '../odoo-client.js';
import { loadConfig } from './config.js';
import { collectEvents, currentCursors } from './events.js';
import { runAction } from './actions.js';
import { STATS_KEYBOARD, buildDigest, buildStats, isStatsKey } from './stats.js';
import { loadState, saveState, type BotState } from './state.js';

const COMMANDS = [
  { command: 'help', description: 'Список команд з поясненнями' },
  { command: 'stats', description: 'Статистика: ліди, кампанії, прострочення, сервіс, воронка' },
  { command: 'digest', description: 'Дайджест зараз (щодня приходить зранку сам)' },
  { command: 'overdue', description: 'Прострочені задачі проєктів' },
  { command: 'whoami', description: 'Ваш chat ID' },
  { command: 'request', description: 'Запросити доступ до бота в адміністратора' },
];

const HELP = [
  '<b>Gravity × Odoo — демо-бот</b> (неофіційний стенд, синтетичні дані)',
  '',
  ...COMMANDS.map((item) => `/${item.command} — ${item.description}`),
  '',
  '<b>Сповіщення приходять самі:</b>',
  '🆕 новий лід з AI-розбором → «Взяти в роботу», «Чернетка відповіді»',
  '📐 AI-чернетка специфікації → «Погодити» (створює RFQ)',
  '🛒 чернетка закупівлі → «Підтвердити замовлення»',
  '⏰ прострочена задача → «+3 дні», «Готово»',
  '⛔ здача заблокована, 💬 передоплату отримано, тести пройдено',
  '🚨 критичний сервісний тікет → «Беру»',
  '',
  'Кожна дія з бота залишає запис в Odoo. Бот нічого не надсилає клієнтам і постачальникам.',
].join('\n');

const config = loadConfig();
const odoo = OdooClient.fromEnv();
const bot = new Bot(config.token);
const html = { parse_mode: 'HTML' as const };

// State is loaded before handlers: approved chat IDs live there.
// First start: begin from the current records instead of flooding the chat with history.
const state: BotState = (await loadState()) ?? {
  ...(await currentCursors(odoo)),
  lastDigestDate: new Date().toISOString().slice(0, 10),
  approvedChatIds: [],
};

const allowedChats = () => [...new Set([config.adminChatId, ...config.allowedChatIds, ...state.approvedChatIds])];

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

bot.command('request', async (ctx) => {
  const chatId = ctx.chat.id;
  if (allowedChats().includes(chatId)) return ctx.reply('У вас уже є доступ. /help — список команд.');

  const who = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name ?? 'невідомий');
  const keyboard = new InlineKeyboard().text('✅ Дозволити', `access:approve:${chatId}`).text('❌ Відхилити', `access:deny:${chatId}`);
  await bot.api.sendMessage(config.adminChatId, `🔑 Запит на доступ: ${who}, chat ID <code>${chatId}</code>`, { ...html, reply_markup: keyboard });

  return ctx.reply('Запит надіслано адміністратору. Ви отримаєте повідомлення після рішення.');
});

bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || allowedChats().includes(chatId)) return next();

  // Service updates (e.g. the user blocked the bot) get no reply: Telegram would reject it.
  const isUserInput = ctx.message !== undefined || ctx.callbackQuery !== undefined;
  if (isUserInput) await ctx.reply('Доступ закрито. Надішліть /request, щоб попросити доступ.');
});

bot.callbackQuery(/^access:(approve|deny):(-?\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.chat?.id !== config.adminChatId) return ctx.reply('Лише адміністратор може надавати доступ.');

  const approve = ctx.match[1] === 'approve';
  const chatId = Number(ctx.match[2]);
  if (approve && !state.approvedChatIds.includes(chatId)) state.approvedChatIds.push(chatId);
  if (approve === false) state.approvedChatIds = state.approvedChatIds.filter((id) => id !== chatId);
  await saveState(state);

  await bot.api.sendMessage(chatId, approve ? '✅ Доступ надано. /help — список команд.' : '❌ У доступі відмовлено.').catch(() => undefined);

  return ctx.reply(`${approve ? 'Доступ надано' : 'Відмовлено'}: ${chatId}`);
});

bot.command('help', (ctx) => ctx.reply(HELP, html));
bot.command('stats', (ctx) => ctx.reply('Оберіть звіт:', { reply_markup: STATS_KEYBOARD }));
bot.command('digest', async (ctx) => ctx.reply(await buildDigest(odoo), html));
bot.command('overdue', async (ctx) => ctx.reply(await buildStats(odoo, 'stats:overdue'), html));

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  try {
    const actor = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    const text = isStatsKey(data) ? await buildStats(odoo, data) : await runAction({ odoo, odooUserId: config.odooUserId, actor }, data);
    await ctx.reply(text, html);
  } catch (error) {
    await ctx.reply(`Помилка: ${error instanceof Error ? error.message : String(error)}`);
  }
});

const errorText = (error: unknown) => (error instanceof Error ? error.message : String(error));

// One chat that blocked the bot must not stop notifications for the others.
const broadcast = async (text: string, options: Record<string, unknown> = {}) => {
  for (const chatId of allowedChats()) {
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
  for (const event of events) await broadcast(event.text, { reply_markup: event.keyboard });

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
