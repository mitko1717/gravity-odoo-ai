// Synthetic partners (designers, architects, developers). Not real companies or people.
export const CONTACT_INTERVAL_DAYS = 30;

export const PARTNER_TAGS = ['Партнер: дизайнер', 'Партнер: архітектор', 'Партнер: забудовник'];

export interface DemoPartner {
  name: string;
  tag: string;
  daysSinceContact: number;
}

export const DEMO_PARTNERS: DemoPartner[] = [
  { name: 'Студія інтер’єру «Демо-Лофт»', tag: 'Партнер: дизайнер', daysSinceContact: 5 },
  { name: 'Архітектурне бюро «Демо-Арх»', tag: 'Партнер: архітектор', daysSinceContact: 25 },
  { name: 'Дизайнерка Олена Демо', tag: 'Партнер: дизайнер', daysSinceContact: 40 },
  { name: 'Забудовник «Демо-Буд»', tag: 'Партнер: забудовник', daysSinceContact: 90 },
];
