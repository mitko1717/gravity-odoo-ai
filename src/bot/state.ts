import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';

// Cursors of already-notified records. Local JSON is enough for one bot instance.
export interface BotState {
  lastLeadId: number;
  lastActivityId: number;
  lastMessageId: number;
  lastTicketId: number;
  lastRfqId: number;
  lastDigestDate: string;
  approvedChatIds: number[];
}

const STATE_FILE = process.env.BOT_STATE_FILE ?? 'tmp/bot-state.json';

const EMPTY: BotState = { lastLeadId: 0, lastActivityId: 0, lastMessageId: 0, lastTicketId: 0, lastRfqId: 0, lastDigestDate: '', approvedChatIds: [] };

export async function loadState(): Promise<BotState | undefined> {
  try {
    const text = await readFile(STATE_FILE, 'utf8');

    return { ...EMPTY, ...(JSON.parse(text) as Partial<BotState>) };
  } catch {
    return undefined;
  }
}

export async function saveState(state: BotState): Promise<void> {
  await mkdir(dirname(STATE_FILE), { recursive: true });
  await writeFile(STATE_FILE, JSON.stringify(state, null, 2));
}
