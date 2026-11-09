import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { OdooClient } from '../odoo-client.js';
import type { Role } from './roles.js';

// Cursors of already-notified records. Local JSON is enough for one bot instance.
export interface BotState {
  lastLeadId: number;
  lastActivityId: number;
  lastMessageId: number;
  lastTicketId: number;
  lastRfqId: number;
  lastDigestDate: string;
  /** Date (YYYY-MM-DD) of the last Monday the weekly report was sent. */
  lastWeeklyDate: string;
  lastApplicantId: number;
  lastEventId: number;
  /** Max write_date of pipeline tasks already seen ('' = not initialised). */
  lastTaskWrite: string;
  /** Last known stage name per pipeline task, to detect transitions. */
  taskStages: Record<string, string>;
  /** helpdesk.sla.status IDs already reported as breached. */
  slaNotified: number[];
  /** false = first SLA poll not done yet (existing breaches are stored silently). */
  slaReady: boolean;
  /** Approved users by chat ID (admin is implicit). */
  users: Record<string, BotUser>;
}

export interface BotUser {
  name: string;
  roles: Role[];
  /** false = access closed by the admin; the user and roles stay in the list. */
  active: boolean;
}

const STATE_FILE = process.env.BOT_STATE_FILE ?? 'tmp/bot-state.json';

const EMPTY: BotState = { lastLeadId: 0, lastActivityId: 0, lastMessageId: 0, lastTicketId: 0, lastRfqId: 0, lastDigestDate: '', lastWeeklyDate: '', lastApplicantId: 0, lastEventId: 0, lastTaskWrite: '', taskStages: {}, slaNotified: [], slaReady: false, users: {} };

const PARAM_KEY = 'gravity_bot.state';

// Hosting (Railway) has an ephemeral filesystem, so BOT_STATE_STORE=odoo keeps the state in ir.config_parameter.
let odooStore: OdooClient | undefined;
let lastSaved = '';

export function useOdooStore(odoo: OdooClient): void {
  odooStore = odoo;
}

async function readRaw(): Promise<string> {
  if (odooStore === undefined) return readFile(STATE_FILE, 'utf8');

  const value = await odooStore.call<string | false>('ir.config_parameter', 'get_param', { key: PARAM_KEY });
  if (value) return value;

  // First run with the Odoo store: migrate the local file if there is one.
  return readFile(STATE_FILE, 'utf8');
}

export async function loadState(): Promise<BotState | undefined> {
  try {
    const text = await readRaw();

    const raw = JSON.parse(text) as Partial<BotState> & { approvedChatIds?: number[] };
    const users = { ...(raw.users ?? {}) };
    for (const chatId of raw.approvedChatIds ?? []) users[String(chatId)] ??= { name: String(chatId), roles: [], active: true };

    for (const user of Object.values(users)) user.active ??= true;

    return { ...EMPTY, ...raw, users };
  } catch {
    return undefined;
  }
}

export async function saveState(state: BotState): Promise<void> {
  const text = JSON.stringify(state, null, 2);
  if (text === lastSaved) return;

  lastSaved = text;

  if (odooStore !== undefined) {
    await odooStore.call<boolean>('ir.config_parameter', 'set_param', { key: PARAM_KEY, value: text });

    return;
  }

  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, text);
}
