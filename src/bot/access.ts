import { InlineKeyboard, type Bot } from 'grammy';
import { ROLES, isRole, roleLabels, type Role } from './roles.js';
import { saveState, type BotState } from './state.js';
import { updateAllowedChatIds } from './env-file.js';
import { escapeHtml } from './format.js';

// Access control and role management. Admin: TELEGRAM_ADMIN_CHAT_ID. Users live in the state file.
export interface AccessDeps {
  bot: Bot;
  state: BotState;
  adminChatId: number;
  /** Legacy fixed list from .env: without a stored user entry they receive every role. */
  envChatIds: number[];
}

const html = { parse_mode: 'HTML' as const };

export function createAccess(deps: AccessDeps) {
  const { bot, state, adminChatId, envChatIds } = deps;

  const allowedChats = (): number[] => [...new Set([adminChatId, ...envChatIds, ...Object.keys(state.users).map(Number)])];

  const recipients = (role: Role | undefined): number[] =>
    allowedChats().filter((chatId) => {
      if (chatId === adminChatId || role === undefined) return true;

      const user = state.users[String(chatId)];
      if (user === undefined) return envChatIds.includes(chatId);

      return user.roles.includes(role);
    });

  const userText = (chatId: string) => {
    const user = state.users[chatId];

    return `👤 <b>${escapeHtml(user?.name ?? chatId)}</b> · <code>${chatId}</code>\nРолі: ${roleLabels(user?.roles ?? [])}`;
  };

  const userKeyboard = (chatId: string) => {
    const roles = state.users[chatId]?.roles ?? [];
    const keyboard = new InlineKeyboard();
    ROLES.forEach((role, index) => {
      keyboard.text(`${roles.includes(role.key) ? '✅' : '▫️'} ${role.label}`, `role:toggle:${chatId}:${role.key}`);
      if (index % 2 === 1) keyboard.row();
    });

    return keyboard.row().text('🚫 Забрати доступ', `user:remove:${chatId}`);
  };

  const isAdmin = (chatId: number | undefined) => chatId === adminChatId;

  const register = () => {
    bot.command('request', async (ctx) => {
      const chatId = ctx.chat.id;
      if (allowedChats().includes(chatId)) return ctx.reply('У вас уже є доступ. /help — список команд.');

      const who = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name ?? 'невідомий');
      const keyboard = new InlineKeyboard().text('✅ Дозволити', `access:approve:${chatId}:${encodeURIComponent(who).slice(0, 30)}`).text('❌ Відхилити', `access:deny:${chatId}`);
      await bot.api.sendMessage(adminChatId, `🔑 Запит на доступ: ${escapeHtml(who)}, chat ID <code>${chatId}</code>`, { ...html, reply_markup: keyboard });

      return ctx.reply('Запит надіслано адміністратору. Ви отримаєте повідомлення після рішення.');
    });

    bot.use(async (ctx, next) => {
      const chatId = ctx.chat?.id;
      if (chatId === undefined || allowedChats().includes(chatId)) return next();

      // Service updates (e.g. the user blocked the bot) get no reply: Telegram would reject it.
      const isUserInput = ctx.message !== undefined || ctx.callbackQuery !== undefined;
      if (isUserInput) await ctx.reply('Доступ закрито. Надішліть /request, щоб попросити доступ.');
    });

    bot.callbackQuery(/^access:(approve|deny):(-?\d+)(?::(.*))?$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      if (isAdmin(ctx.chat?.id) === false) return ctx.reply('Лише адміністратор може надавати доступ.');

      const approve = ctx.match[1] === 'approve';
      const chatId = String(ctx.match[2]);
      if (approve) state.users[chatId] ??= { name: decodeURIComponent(ctx.match[3] ?? chatId), roles: [] };
      if (approve === false) delete state.users[chatId];
      await saveState(state);
      await updateAllowedChatIds(Number(chatId), approve);

      const notice = approve ? '✅ Доступ надано. Адміністратор призначить вам ролі. /help — список команд.' : '❌ У доступі відмовлено.';
      await bot.api.sendMessage(Number(chatId), notice).catch(() => undefined);
      if (approve === false) return ctx.reply(`Відмовлено: ${chatId}`);

      return ctx.reply(`Доступ надано. Оберіть ролі:\n\n${userText(chatId)}`, { ...html, reply_markup: userKeyboard(chatId) });
    });

    bot.command('users', async (ctx) => {
      if (isAdmin(ctx.chat.id) === false) return ctx.reply('Команда лише для адміністратора.');

      const chatIds = Object.keys(state.users);
      if (chatIds.length === 0) return ctx.reply('Користувачів ще немає. Нові приходять через /request.');

      for (const chatId of chatIds) await ctx.reply(userText(chatId), { ...html, reply_markup: userKeyboard(chatId) });
    });

    bot.callbackQuery(/^role:toggle:(-?\d+):(\w+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const chatId = String(ctx.match[1]);
      const role = String(ctx.match[2]);
      const user = state.users[chatId];
      if (isAdmin(ctx.chat?.id) === false || user === undefined || isRole(role) === false) return;

      user.roles = user.roles.includes(role) ? user.roles.filter((item) => item !== role) : [...user.roles, role];
      await saveState(state);
      await ctx.editMessageText(userText(chatId), { ...html, reply_markup: userKeyboard(chatId) });
      await bot.api.sendMessage(Number(chatId), `Ваші ролі в боті: ${roleLabels(user.roles)}`).catch(() => undefined);
    });

    bot.callbackQuery(/^user:remove:(-?\d+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      if (isAdmin(ctx.chat?.id) === false) return;

      const chatId = String(ctx.match[1]);
      delete state.users[chatId];
      await saveState(state);
      await updateAllowedChatIds(Number(chatId), false);
      await bot.api.sendMessage(Number(chatId), '🚫 Доступ до бота закрито адміністратором.').catch(() => undefined);
      await ctx.editMessageText(`🚫 Доступ закрито: <code>${chatId}</code>`, html);
    });
  };

  return { allowedChats, recipients, register, isAdmin };
}
