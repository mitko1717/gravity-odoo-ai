// Notification roles. The admin receives everything; other users only their roles.
export const ROLES = [
  { key: 'sales', label: '💼 Sales', hint: 'new leads' },
  { key: 'pm', label: '📋 PM', hint: 'overdue, payments, handover' },
  { key: 'engineer', label: '📐 Engineer', hint: 'draft specifications' },
  { key: 'procurement', label: '🛒 Purchasing', hint: 'draft RFQs' },
  { key: 'service', label: '🛠 Service', hint: 'critical tickets' },
  { key: 'hr', label: '👥 HR', hint: 'new applicants' },
] as const;

export type Role = (typeof ROLES)[number]['key'];

export const isRole = (value: string): value is Role => ROLES.some((role) => role.key === value);

export const roleLabels = (roles: Role[]): string =>
  roles.length === 0 ? 'no roles (commands only)' : ROLES.filter((role) => roles.includes(role.key)).map((role) => role.label).join(', ');
