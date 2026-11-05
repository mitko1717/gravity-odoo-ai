export interface BotConfig {
  token: string;
  allowedChatIds: number[];
  adminChatId: number;
  odooUrl: string;
  odooUserId: number;
  pollSeconds: number;
  digestHour: number;
}

const required = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} must be set in .env`);

  return value;
};

export function loadConfig(): BotConfig {
  const allowedChatIds = (process.env.TELEGRAM_ALLOWED_CHAT_IDS ?? '')
    .split(',')
    .map((id) => Number(id.trim()))
    .filter((id) => Number.isInteger(id) && id !== 0);

  return {
    token: required('TELEGRAM_BOT_TOKEN'),
    allowedChatIds,
    adminChatId: Number(required('TELEGRAM_ADMIN_CHAT_ID')),
    odooUrl: required('ODOO_URL'),
    odooUserId: Number(process.env.ODOO_BOT_USER_ID ?? 2),
    pollSeconds: Number(process.env.BOT_POLL_SECONDS ?? 30),
    digestHour: Number(process.env.BOT_DIGEST_HOUR ?? 9),
  };
}
