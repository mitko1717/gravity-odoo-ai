import { readFile, writeFile } from 'node:fs/promises';

// Keeps TELEGRAM_ALLOWED_CHAT_IDS in the local .env in sync with admin decisions.
// Best effort: on hosting without a .env file (e.g. Railway) the state file is the source of truth.
const ENV_FILE = process.env.BOT_ENV_FILE ?? '.env';
const KEY = 'TELEGRAM_ALLOWED_CHAT_IDS';

export async function updateAllowedChatIds(chatId: number, allow: boolean): Promise<boolean> {
  let text: string;

  try {
    text = await readFile(ENV_FILE, 'utf8');
  } catch {
    return false;
  }

  const lines = text.split('\n');
  const index = lines.findIndex((line) => line.startsWith(`${KEY}=`));
  const current = index >= 0 ? (lines[index] ?? '').slice(KEY.length + 1) : '';
  const ids = new Set(current.split(',').map((id) => id.trim()).filter((id) => id.length > 0));

  if (allow) ids.add(String(chatId));
  if (allow === false) ids.delete(String(chatId));

  const line = `${KEY}=${[...ids].join(',')}`;
  if (index >= 0) lines[index] = line;
  if (index < 0) lines.push(line);

  await writeFile(ENV_FILE, lines.join('\n'));

  return true;
}
