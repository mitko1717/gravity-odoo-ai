import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Role } from './roles.js';

// Cursors of already-notified records. Local JSON is enough for one bot instance.
export interface BotState {
  lastLeadId: number;
  lastActivityId: number;
  lastMessageId: number;
  lastTicketId: number;
  lastRfqId: number;
  lastDigestDate: string;
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

const EMPTY: BotState = { lastLeadId: 0, lastActivityId: 0, lastMessageId: 0, lastTicketId: 0, lastRfqId: 0, lastDigestDate: '', lastApplicantId: 0, lastEventId: 0, lastTaskWrite: '', taskStages: {}, slaNotified: [], slaReady: false, users: {} };

export async function loadState(): Promise<BotState | undefined> {
  try {
    const text = await readFile(STATE_FILE, 'utf8');

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
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}
