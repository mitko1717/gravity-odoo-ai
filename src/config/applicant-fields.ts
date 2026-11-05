import type { FieldSpec } from '../ensure.js';

export const APPLICANT_AI_FIELDS: FieldSpec[] = [
  {
    name: 'x_ai_status',
    label: 'AI: статус',
    type: 'selection',
    options: [['done', 'Проаналізовано'], ['needs_review', 'Потребує перевірки']],
  },
  {
    name: 'x_ai_fit',
    label: 'AI: відповідність вакансії (рекомендація)',
    type: 'selection',
    options: [['strong', 'Сильна'], ['possible', 'Можлива'], ['weak', 'Слабка'], ['unclear', 'Недостатньо даних']],
  },
  { name: 'x_ai_profile', label: 'AI: профіль кандидата', type: 'text' },
  { name: 'x_ai_skills', label: 'AI: ключові навички', type: 'char' },
  { name: 'x_ai_gaps', label: 'AI: прогалини / відсутні дані', type: 'text' },
  { name: 'x_ai_questions', label: 'AI: питання для інтерв’ю', type: 'text' },
  { name: 'x_ai_next_action', label: 'AI: рекомендація рекрутеру', type: 'char' },
];
