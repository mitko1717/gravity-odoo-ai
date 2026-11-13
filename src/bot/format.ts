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

export const PRIORITY_LABEL: Record<string, string> = { high: '🔴 high', medium: '🟡 medium', low: '⚪ low' };

const SERVICE_LABEL: Record<string, string> = {
  smart_home: 'smart home',
  lighting: 'lighting',
  climate: 'climate',
  security: 'security',
  electrical: 'electrical',
  engineering: 'engineering systems',
  heat_pump: 'heat pump',
  service: 'service',
  other: 'other',
};

export const serviceLabels = (codes: string): string =>
  codes
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length > 0)
    .map((code) => SERVICE_LABEL[code] ?? code)
    .join(', ');

const MISSING_LABEL: Record<string, string> = {
  phone_or_email: 'phone or email',
  phone: 'phone',
  email: 'email',
  object_type: 'property type',
  location: 'location',
  city: 'city',
  area: 'area',
  area_m2: 'area',
  budget: 'budget',
  timeline: 'timeline',
  services: 'services',
};

export const missingLabels = (codes: string): string =>
  codes
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length > 0)
    .map((code) => MISSING_LABEL[code] ?? code)
    .join(', ');

const KYIV_FORMAT = new Intl.DateTimeFormat('uk-UA', { timeZone: 'Europe/Kyiv', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/** Odoo datetimes are UTC strings 'YYYY-MM-DD HH:MM:SS'; the bot shows Kyiv time. */
export const kyivTime = (odooUtc: string): string => {
  const date = new Date(`${odooUtc.replace(' ', 'T')}Z`);
  if (Number.isNaN(date.getTime())) return odooUtc;

  return KYIV_FORMAT.format(date);
};
