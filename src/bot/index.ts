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

  await ctx.reply('Доступ закрито. Надішліть /request, щоб попросити доступ.');
});

bot.callbackQuery(/^access:(approve|deny):(-?\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  if (ctx.chat?.id !== config.adminChatId) return ctx.reply('Лише адміністратор може надавати доступ.');

  const approve = ctx.match[1] === 'approve';
  const chatId = Number(ctx.match[2]);
  if (approve && !state.approvedChatIds.includes(chatId)) state.approvedChatIds.push(chatId);
  if (approve === false) state.approvedChatIds = state.approvedChatIds.filter((id) => id !== chatId);
  await saveState(state);

  await bot.api.sendMessage(chatId, approve ? '✅ Доступ надано. /help — список команд.' : '❌ У доступі відмовлено.');

  return ctx.reply(`${approve ? 'Доступ надано' : 'Відмовлено'}: ${chatId}`);
});

bot.command(['start', 'help'], (ctx) => ctx.reply(HELP, html));
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

const broadcast = async (text: string, options: Record<string, unknown> = {}) => {
  for (const chatId of allowedChats()) await bot.api.sendMessage(chatId, text, { ...html, ...options });
};

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

  let running = false;
  setInterval(() => {
    if (running) return;

    running = true;
    tick()
      .catch((error: unknown) => console.error('poll failed:', error instanceof Error ? error.message : error))
      .finally(() => {
        running = false;
      });
  }, config.pollSeconds * 1000);

  console.log(`bot started, admin ${config.adminChatId}, allowed chats: ${allowedChats().join(', ')}, poll ${config.pollSeconds}s`);
  await bot.start();
};

await main();
