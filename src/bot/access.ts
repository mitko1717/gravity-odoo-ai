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

  const activeUserIds = () => Object.entries(state.users).filter(([, user]) => user.active).map(([chatId]) => Number(chatId));
  const closedUserIds = () => Object.entries(state.users).filter(([, user]) => user.active === false).map(([chatId]) => Number(chatId));

  // Closed users are excluded even if their ID is still in the .env list.
  const allowedChats = (): number[] => [...new Set([adminChatId, ...envChatIds, ...activeUserIds()])].filter((id) => id === adminChatId || closedUserIds().includes(id) === false);

  const recipients = (role: Role | undefined): number[] =>
    allowedChats().filter((chatId) => {
      if (chatId === adminChatId || role === undefined) return true;

      const user = state.users[String(chatId)];
      if (user === undefined) return envChatIds.includes(chatId);

      return user.roles.includes(role);
    });

  const userText = (chatId: string) => {
    const user = state.users[chatId];

    const status = user?.active === false ? '🚫 access closed' : '✅ access open';

    return `👤 <b>${escapeHtml(user?.name ?? chatId)}</b> · <code>${chatId}</code>\n${status}\nRoles: ${roleLabels(user?.roles ?? [])}`;
  };

  const userKeyboard = (chatId: string) => {
    const roles = state.users[chatId]?.roles ?? [];
    const keyboard = new InlineKeyboard();
    ROLES.forEach((role, index) => {
      keyboard.text(`${roles.includes(role.key) ? '✅' : '▫️'} ${role.label}`, `role:toggle:${chatId}:${role.key}`);
      if (index % 2 === 1) keyboard.row();
    });

    const active = state.users[chatId]?.active !== false;
    keyboard.row().text(active ? '🚫 Close access' : '✅ Open access', `user:active:${chatId}:${active ? 'off' : 'on'}`);

    return keyboard.text('🗑 Delete', `user:delete:${chatId}`);
  };

  const isAdmin = (chatId: number | undefined) => chatId === adminChatId;

  const register = () => {
    // Keep display names fresh: users approved by ID get their Telegram name on the next message.
    bot.use(async (ctx, next) => {
      const user = ctx.chat ? state.users[String(ctx.chat.id)] : undefined;
      const name = ctx.from?.username ? `@${ctx.from.username}` : ctx.from?.first_name;
      if (user !== undefined && name !== undefined && user.name !== name) {
        user.name = name;
        await saveState(state);
      }

      return next();
    });

    bot.command('request', async (ctx) => {
      const chatId = ctx.chat.id;
      if (allowedChats().includes(chatId)) return ctx.reply('You already have access. /help for the command list.');

      const who = ctx.from?.username ? `@${ctx.from.username}` : (ctx.from?.first_name ?? 'unknown');
      const keyboard = new InlineKeyboard().text('✅ Allow', `access:approve:${chatId}:${encodeURIComponent(who).slice(0, 30)}`).text('❌ Deny', `access:deny:${chatId}`);
      await bot.api.sendMessage(adminChatId, `🔑 Access request: ${escapeHtml(who)}, chat ID <code>${chatId}</code>`, { ...html, reply_markup: keyboard });

      return ctx.reply('Request sent to the administrator. You will get a message after the decision.');
    });

    bot.use(async (ctx, next) => {
      const chatId = ctx.chat?.id;
      if (chatId === undefined || allowedChats().includes(chatId)) return next();

      // Service updates (e.g. the user blocked the bot) get no reply: Telegram would reject it.
      const isUserInput = ctx.message !== undefined || ctx.callbackQuery !== undefined;
      if (isUserInput) await ctx.reply('Access closed. Send /request to ask for access.');
    });

    bot.callbackQuery(/^access:(approve|deny):(-?\d+)(?::(.*))?$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      if (isAdmin(ctx.chat?.id) === false) return ctx.reply('Only the administrator can grant access.');

      const approve = ctx.match[1] === 'approve';
      const chatId = String(ctx.match[2]);
      if (approve) state.users[chatId] = { name: decodeURIComponent(ctx.match[3] ?? chatId), roles: state.users[chatId]?.roles ?? [], active: true };
      if (approve === false) delete state.users[chatId];
      await saveState(state);
      await updateAllowedChatIds(Number(chatId), approve);

      const notice = approve ? '✅ Access granted. The administrator will assign your roles. /help for the command list.' : '❌ Access denied.';
      await bot.api.sendMessage(Number(chatId), notice).catch(() => undefined);
      if (approve === false) return ctx.reply(`Denied: ${chatId}`);

      return ctx.reply(`Access granted. Choose roles:\n\n${userText(chatId)}`, { ...html, reply_markup: userKeyboard(chatId) });
    });

    bot.command('users', async (ctx) => {
      if (isAdmin(ctx.chat.id) === false) return ctx.reply('Admin-only command.');

      const chatIds = Object.keys(state.users);
      if (chatIds.length === 0) return ctx.reply('No users yet. New users come via /request.');

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
    });

    bot.callbackQuery(/^user:active:(-?\d+):(on|off)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const chatId = String(ctx.match[1]);
      const user = state.users[chatId];
      if (isAdmin(ctx.chat?.id) === false || user === undefined) return;

      user.active = ctx.match[2] === 'on';
      await saveState(state);
      await updateAllowedChatIds(Number(chatId), user.active);
      await ctx.editMessageText(userText(chatId), { ...html, reply_markup: userKeyboard(chatId) });

      const notice = user.active ? '✅ Bot access reopened. /help for the command list.' : '🚫 Bot access closed by the administrator.';
      await bot.api.sendMessage(Number(chatId), notice).catch(() => undefined);
    });

    bot.callbackQuery(/^user:delete:(-?\d+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      if (isAdmin(ctx.chat?.id) === false) return;

      const chatId = String(ctx.match[1]);
      const keyboard = new InlineKeyboard().text('🗑 Yes, delete', `user:delete-confirm:${chatId}`).text('↩️ Cancel', `user:show:${chatId}`);
      await ctx.editMessageText(`${userText(chatId)}\n\n<b>Delete this user completely?</b> Roles will be lost; they can come back only via /request.`, { ...html, reply_markup: keyboard });
    });

    bot.callbackQuery(/^user:show:(-?\d+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      const chatId = String(ctx.match[1]);
      if (isAdmin(ctx.chat?.id) === false || state.users[chatId] === undefined) return;

      await ctx.editMessageText(userText(chatId), { ...html, reply_markup: userKeyboard(chatId) });
    });

    bot.callbackQuery(/^user:delete-confirm:(-?\d+)$/, async (ctx) => {
      await ctx.answerCallbackQuery();
      if (isAdmin(ctx.chat?.id) === false) return;

      const chatId = String(ctx.match[1]);
      delete state.users[chatId];
      await saveState(state);
      await updateAllowedChatIds(Number(chatId), false);
      await bot.api.sendMessage(Number(chatId), '🚫 Bot access closed by the administrator.').catch(() => undefined);
      await ctx.editMessageText(`🗑 User <code>${chatId}</code> deleted.`, html);
    });

  };

  // Admin and legacy .env users without an entry hold every role, the same rule as for notifications.
  const hasRole = (chatId: number, role: Role): boolean => recipients(role).includes(chatId);

  return { allowedChats, recipients, register, isAdmin, hasRole };
}
