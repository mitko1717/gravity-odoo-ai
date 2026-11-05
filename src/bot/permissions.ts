import type { OdooClient } from '../odoo-client.js';
import { ROLES, type Role } from './roles.js';
import { stageOwnerRole } from './pipeline.js';

// Which role may press which button. The admin and the PM may press everything; read-only buttons need no role.
const BUTTON_ROLE: Record<string, Role> = {
  'lead:take': 'sales',
  'lead:reply': 'sales',
  'lead:quote': 'sales',
  'order:confirm': 'sales',
  'spec:approve': 'engineer',
  'rfq:confirm': 'procurement',
  'task:shift': 'pm',
  'task:done': 'pm',
  'ticket:take': 'service',
  'pchk:done': 'engineer',
};

const READ_ONLY = new Set(['pcard:open', 'pchk:list']);

const roleLabel = (role: Role): string => ROLES.find((item) => item.key === role)?.label ?? role;

/** Returns the role a button needs, or undefined if anyone allowed in the bot may press it. */
export async function requiredRole(odoo: OdooClient, data: string): Promise<Role | undefined> {
  const separator = data.lastIndexOf(':');
  const action = data.slice(0, separator);
  const id = Number(data.slice(separator + 1));
  if (READ_ONLY.has(action)) return undefined;

  // Stage buttons belong to the owner of that stage.
  if (action.startsWith('pstage:')) return stageOwnerRole(odoo, id);

  return BUTTON_ROLE[action];
}

export interface PermissionCheck {
  hasRole: (chatId: number, role: Role) => boolean;
}

/** undefined = allowed; otherwise the refusal text. */
export async function checkButton(odoo: OdooClient, access: PermissionCheck, chatId: number, data: string): Promise<string | undefined> {
  const role = await requiredRole(odoo, data);
  if (role === undefined) return undefined;
  if (access.hasRole(chatId, role) || access.hasRole(chatId, 'pm')) return undefined;

  return `Ця дія для ролі «${roleLabel(role)}». Попросіть адміністратора додати роль у /users.`;
}
