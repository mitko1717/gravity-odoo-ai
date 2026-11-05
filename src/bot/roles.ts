// Notification roles. The admin receives everything; other users only their roles.
export const ROLES = [
  { key: 'sales', label: '💼 Продажі', hint: 'нові ліди' },
  { key: 'pm', label: '📋 PM', hint: 'прострочення, оплати, здача' },
  { key: 'engineer', label: '📐 Інженер', hint: 'чернетки специфікацій' },
  { key: 'procurement', label: '🛒 Закупівлі', hint: 'чернетки RFQ' },
  { key: 'service', label: '🛠 Сервіс', hint: 'критичні тікети' },
  { key: 'hr', label: '👥 HR', hint: 'нові кандидати' },
] as const;

export type Role = (typeof ROLES)[number]['key'];

export const isRole = (value: string): value is Role => ROLES.some((role) => role.key === value);

export const roleLabels = (roles: Role[]): string =>
  roles.length === 0 ? 'без ролей (лише команди)' : ROLES.filter((role) => roles.includes(role.key)).map((role) => role.label).join(', ');
