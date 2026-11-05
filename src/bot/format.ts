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

const SERVICE_LABEL: Record<string, string> = {
  smart_home: 'розумний дім',
  lighting: 'освітлення',
  climate: 'клімат',
  security: 'безпека',
  electrical: 'електрика',
  engineering: 'інженерні системи',
  heat_pump: 'тепловий насос',
  service: 'сервіс',
  other: 'інше',
};

export const serviceLabels = (codes: string): string =>
  codes
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length > 0)
    .map((code) => SERVICE_LABEL[code] ?? code)
    .join(', ');

const MISSING_LABEL: Record<string, string> = {
  phone_or_email: 'телефон або email',
  phone: 'телефон',
  email: 'email',
  object_type: 'тип об’єкта',
  location: 'локація',
  city: 'місто',
  area: 'площа',
  area_m2: 'площа',
  budget: 'бюджет',
  timeline: 'строки',
  services: 'послуги',
};

export const missingLabels = (codes: string): string =>
  codes
    .split(',')
    .map((code) => code.trim())
    .filter((code) => code.length > 0)
    .map((code) => MISSING_LABEL[code] ?? code)
    .join(', ');
