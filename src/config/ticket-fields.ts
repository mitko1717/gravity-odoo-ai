import type { FieldSpec } from '../ensure.js';

export const TICKET_AI_FIELDS: FieldSpec[] = [
  {
    name: 'x_ai_status',
    label: 'AI: статус',
    type: 'selection',
    options: [['done', 'Проаналізовано'], ['needs_review', 'Потребує перевірки']],
  },
  {
    name: 'x_ai_category',
    label: 'AI: система',
    type: 'selection',
    options: [
      ['lighting', 'Освітлення / сценарії'],
      ['climate', 'Клімат / опалення'],
      ['security', 'Безпека / відеонагляд'],
      ['network', 'Мережа / контролер / застосунок'],
      ['electrical', 'Електрика'],
      ['heat_pump', 'Тепловий насос'],
      ['other', 'Інше'],
    ],
  },
  {
    name: 'x_ai_urgency',
    label: 'AI: терміновість',
    type: 'selection',
    options: [['critical', 'Критична'], ['high', 'Висока'], ['normal', 'Звичайна'], ['low', 'Низька']],
  },
  { name: 'x_ai_summary', label: 'AI: суть проблеми', type: 'text' },
  { name: 'x_ai_next_action', label: 'AI: наступна дія', type: 'char' },
  { name: 'x_ai_reply_draft', label: 'AI: чернетка відповіді', type: 'text' },
];
