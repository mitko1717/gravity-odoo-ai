export const escapeHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

export const stripHtml = (value: unknown): string =>
  String(value ?? '')
    .replace(/<br\s*\/?>|<\/p>/g, '\n')
    .replace(/<[^>]+>/g, '')
    .trim();

export const recordUrl = (odooUrl: string, model: string, id: number): string => `${odooUrl}/odoo/${model}/${id}`;

export const PRIORITY_LABEL: Record<string, string> = { high: '🔴 високий', medium: '🟡 середній', low: '⚪ низький' };
