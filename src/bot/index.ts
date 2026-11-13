import { Bot, InlineKeyboard } from 'grammy';
import { OdooClient } from '../odoo-client.js';
import { loadConfig } from './config.js';
import { collectEvents, currentCursors, leadCard, leadsList } from './events.js';
import { runAction } from './actions.js';
import { STATS_KEYBOARD, buildDigest, buildStats, isStatsKey } from './stats.js';
import { loadState, saveState, useOdooStore, type BotState } from './state.js';
import { createAccess } from './access.js';
import { projectCard, projectsList, runPipelineAction } from './pipeline.js';
import { FLOW_COMMAND, FLOW_TEXT } from './guide.js';
import { buildWeekly, isWeeklyDue } from './weekly.js';
import { checkButton } from './permissions.js';
import type { Role } from './roles.js';

const COMMANDS = [
  { command: 'help', description: 'Command list with explanations' },
  FLOW_COMMAND,
  { command: 'demo', description: 'Demo video (3 min) and project deck' },
  { command: 'leads', description: 'Leads without a quotation (then /lead_ID for a card with buttons)' },
  { command: 'projects', description: 'Projects by stage: who is responsible now (then /project_ID for a card)' },
  { command: 'stats', description: 'Stats: leads, campaigns, overdue, service, funnel' },
  { command: 'digest', description: 'Digest now (it also arrives every morning)' },
  { command: 'weekly', description: 'Weekly owner report: figures + AI commentary (every Monday)' },
  { command: 'overdue', description: 'Overdue project tasks' },
  { command: 'whoami', description: 'Your chat ID' },
  { command: 'request', description: 'Ask the administrator for bot access' },
  { command: 'users', description: 'Admin: users and their roles' },
];

const HELP = [
  '<b>Opsline ops bot</b> · demo company Northwind Home Systems (synthetic data)',
  '',
  ...COMMANDS.map((item) => `/${item.command} — ${item.description}`),
  '',
  '<b>Notifications arrive on their own:</b>',
  '📋 /leads for the list, /lead_ID for a lead card with buttons',
  '📁 /projects for project stages; /project_ID for each stage status, buttons «Start / To review / Done», 🧪 checklist',
  '👉 «Your turn»: when a stage is finished, the owner of the next stage is notified',
  '🆕 new lead with AI analysis → «Take it», «Reply draft», «Create quotation»',
  '📄 draft quotation → «Confirm order» (project + prepayment invoice)',
  '📐 AI draft specification → «Approve» (creates RFQs)',
  '🛒 draft purchase → «Confirm purchase»',
  '👤 new applicant with an AI profile (HR)',
  '⏰ overdue task → «+3 days», «Done»',
  '⛔ handover blocked, 💬 prepayment received, tests passed',
  '🚨 critical service ticket → «I take it»',
  '',
  'Notifications go by role (sales, PM, engineer, purchasing, service, HR); the administrator assigns roles in /users.',
  '',
  'Every bot action leaves a record in Odoo. The bot never sends anything to clients or vendors.',
].join('\n');

const config = loadConfig();
const odoo = OdooClient.fromEnv();
const bot = new Bot(config.token);
const html = { parse_mode: 'HTML' as const };

// State is loaded before handlers: approved chat IDs live there.
// First start: begin from the current records instead of flooding the chat with history.
if (process.env.BOT_STATE_STORE === 'odoo') useOdooStore(odoo);

const loaded = await loadState();
const cursors = await currentCursors(odoo);

// Cursors missing in an older state file start from the current records (no flood after upgrades).
if (loaded !== undefined && loaded.lastApplicantId === 0) loaded.lastApplicantId = cursors.lastApplicantId;
if (loaded !== undefined && loaded.lastEventId === 0) loaded.lastEventId = cursors.lastEventId;

const state: BotState = loaded ?? {
  ...cursors,
  lastDigestDate: new Date().toISOString().slice(0, 10),
  lastWeeklyDate: '',
  lastTaskWrite: '',
  taskStages: {},
  slaNotified: [],
  slaReady: false,
  users: {},
};

const access = createAccess({ bot, state, adminChatId: config.adminChatId, envChatIds: config.allowedChatIds });
const allowedChats = access.allowedChats;

const DESCRIPTION = [
  'Opsline demo bot for Odoo (fictional company Northwind Home Systems, all data synthetic).',
  '',
  'What it does: new requests with AI analysis, specification and purchase approvals, overdue tasks, critical service tickets, stats and a morning digest.',
  '',
  'Press Start, then /request to ask for access.',
].join('\n');

const WELCOME = [
  '👋 <b>Hi! This is the Opsline demo bot for Odoo.</b>',
  '',
  'It shows how a team can work with the ERP right from Telegram:',
  '• new website requests arrive with AI analysis and a «Take it» button;',
  '• one-tap approval of specifications and purchases;',
  '• alerts about overdue tasks, blocked handovers, payments and critical tickets;',
  '• stats and a morning digest.',
  '',
  'Northwind Home Systems is a fictional company; all data is synthetic.',
  'Demo video and deck: /demo',
  'To get access, send /request and the administrator will approve it.',
].join('\n');

// Public links: available before access is granted, so reviewers can watch the demo first.
const DEMO_TEXT = '🎬 <b>Opsline demo: Odoo × AI</b>\nVideo (3 min, captions): website request → AI → CRM → quotation → project → purchasing → checks → handover, plus service, HR, meetings and the AI assistant.\nDeck: 10 slides on the problem, the solution and the metrics.\nThe AI assistant answers only from internal regulations (opens for users of the Odoo stand).';
const DEMO_KEYBOARD = new InlineKeyboard()
  .url('▶ Video', 'https://claude.ai/artifact/9mntsBuQdJ38R4xooKN81z')
  .row()
  .url('📊 Deck', 'https://claude.ai/artifact/Jk3Wfpe1ruCBocPP4TTYxf')
  .row()
  .url('💻 Repository', 'https://github.com/mitko1717/gravity-odoo-ai')
  .row()
  .url('🤖 AI assistant (Odoo, login required)', 'https://test6017.odoo.com/odoo/action-919/discuss?scoped_ai_agent_id=7');

bot.command('start', (ctx) => ctx.reply(allowedChats().includes(ctx.chat.id) ? HELP : WELCOME, html));

bot.command('whoami', (ctx) => ctx.reply(`Your chat ID: <code>${ctx.chat.id}</code>`, html));

bot.command('demo', (ctx) => ctx.reply(DEMO_TEXT, { ...html, reply_markup: DEMO_KEYBOARD }));

access.register();

bot.command('help', (ctx) => ctx.reply(HELP, html));
bot.command('leads', async (ctx) => ctx.reply(await leadsList(odoo), html));

// /lead_61 (clickable in the list) or /lead 61
bot.hears(/^\/lead(?:_|\s+)(\d+)/, async (ctx) => {
  const card = await leadCard(odoo, config.odooUrl, Number(ctx.match[1]));
  if (card === undefined) return ctx.reply('Lead not found.');

  return ctx.reply(card.text, { ...html, reply_markup: card.keyboard });
});

bot.command('flow', (ctx) => ctx.reply(FLOW_TEXT, html));

bot.command('projects', async (ctx) => ctx.reply(await projectsList(odoo), html));

bot.hears(/^\/project(?:_|\s+)(\d+)/, async (ctx) => {
  const card = await projectCard(odoo, config.odooUrl, Number(ctx.match[1]));
  if (card === undefined) return ctx.reply('Project not found.');

  return ctx.reply(card.text, { ...html, reply_markup: card.keyboard });
});

// Registered before the generic handler: pipeline buttons edit nothing but Odoo task stages and checks.
bot.callbackQuery(/^(pcard|pstage|pchk):(\w+):(\d+)$/, async (ctx) => {
  await ctx.answerCallbackQuery();
  const refusal = await checkButton(odoo, access, ctx.chat?.id ?? 0, ctx.callbackQuery.data);
  if (refusal !== undefined) return ctx.reply(refusal);
  const actor = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;

  try {
    const result = await runPipelineAction({ odoo, odooUrl: config.odooUrl, actor }, String(ctx.match[1]), String(ctx.match[2]), Number(ctx.match[3]));
    await ctx.reply(result.text, { ...html, reply_markup: result.keyboard });
  } catch (error) {
    await ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
  }
});

bot.command('stats', (ctx) => ctx.reply('Choose a report:', { reply_markup: STATS_KEYBOARD }));
bot.command('digest', async (ctx) => ctx.reply(await buildDigest(odoo), html));
bot.command('weekly', async (ctx) => {
  const weekly = await buildWeekly(odoo, config.odooUrl);
  if (weekly === undefined) return ctx.reply('Weekly report article not found: run npm run seed:weekly.');

  return ctx.reply(weekly.text, { ...html, reply_markup: weekly.keyboard });
});
bot.command('overdue', async (ctx) => ctx.reply(await buildStats(odoo, 'stats:overdue'), html));

bot.on('callback_query:data', async (ctx) => {
  const data = ctx.callbackQuery.data;
  await ctx.answerCallbackQuery();

  try {
    const actor = ctx.from.username ? `@${ctx.from.username}` : ctx.from.first_name;
    if (isStatsKey(data) === false) {
      const refusal = await checkButton(odoo, access, ctx.chat?.id ?? 0, data);
      if (refusal !== undefined) {
        await ctx.reply(refusal);

        return;
      }
    }

    if (isStatsKey(data)) {
      await ctx.reply(await buildStats(odoo, data), html);

      return;
    }

    const result = await runAction({ odoo, odooUserId: config.odooUserId, odooUrl: config.odooUrl, actor }, data);
    await ctx.reply(result.text, { ...html, reply_markup: result.keyboard });
  } catch (error) {
    await ctx.reply(`Error: ${error instanceof Error ? error.message : String(error)}`);
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

  if (isWeeklyDue(now, config.digestHour, state.lastWeeklyDate)) {
    const weekly = await buildWeekly(odoo, config.odooUrl);
    if (weekly !== undefined) await broadcast(weekly.text, { reply_markup: weekly.keyboard }, 'pm');
    state.lastWeeklyDate = today;
  }

  await saveState(state);
};

const main = async () => {
  await saveState(state);
  await bot.api.setMyCommands(COMMANDS);
  await bot.api.setMyDescription(DESCRIPTION);
  await bot.api.setMyShortDescription('Opsline demo: Odoo + AI for a service business. Leads, approvals, stats.');

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
