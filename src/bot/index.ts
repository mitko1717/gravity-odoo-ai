import { Bot } from 'grammy';
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
  { command: 'whoami', description: 'Ваш chat ID для доступу до бота' },
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

bot.command('whoami', (ctx) => ctx.reply(`Ваш chat ID: <code>${ctx.chat.id}</code>\nДодайте його в TELEGRAM_ALLOWED_CHAT_IDS.`, html));

bot.use(async (ctx, next) => {
  const chatId = ctx.chat?.id;
  if (chatId === undefined || config.allowedChatIds.includes(chatId)) return next();

  await ctx.reply('Доступ закрито. Надішліть /whoami і попросіть адміністратора додати ваш chat ID.');
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
  for (const chatId of config.allowedChatIds) await bot.api.sendMessage(chatId, text, { ...html, ...options });
};

const tick = async (state: BotState) => {
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
  // First start: begin from the current records instead of flooding the chat with history.
  const state = (await loadState()) ?? { ...(await currentCursors(odoo)), lastDigestDate: new Date().toISOString().slice(0, 10) };
  await saveState(state);
  await bot.api.setMyCommands(COMMANDS);

  let running = false;
  setInterval(() => {
    if (running) return;

    running = true;
    tick(state)
      .catch((error: unknown) => console.error('poll failed:', error instanceof Error ? error.message : error))
      .finally(() => {
        running = false;
      });
  }, config.pollSeconds * 1000);

  console.log(`bot started, allowed chats: ${config.allowedChatIds.join(', ') || 'none (use /whoami)'}, poll ${config.pollSeconds}s`);
  await bot.start();
};

await main();
