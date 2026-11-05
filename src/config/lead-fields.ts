import type { FieldSpec } from '../ensure.js';

export const FORM_FIELDS: FieldSpec[] = [
  {
    name: 'x_object_type',
    label: 'Тип об’єкта',
    type: 'selection',
    options: [
      ['apartment', 'Квартира'],
      ['house', 'Будинок'],
      ['townhouse', 'Таунхаус'],
      ['commercial', 'Комерційний об’єкт'],
      ['residential_complex', 'Житловий комплекс'],
      ['cottage_town', 'Котеджне містечко'],
    ],
  },
  { name: 'x_city', label: 'Місто', type: 'char' },
  { name: 'x_area_m2', label: 'Площа, м²', type: 'float' },
  {
    name: 'x_service',
    label: 'Послуга',
    type: 'selection',
    options: [
      ['smart_home', 'Розумний дім'],
      ['electrical', 'Електромонтаж'],
      ['engineering', 'Інженерні системи'],
      ['heat_pump', 'Теплові насоси'],
      ['service', 'Сервіс / обслуговування'],
      ['other', 'Інше / не знаю'],
    ],
  },
  { name: 'x_budget_text', label: 'Бюджет (зі слів клієнта)', type: 'char' },
];

export const AI_FIELDS: FieldSpec[] = [
  {
    name: 'x_ai_status',
    label: 'AI: статус',
    type: 'selection',
    options: [
      ['pending', 'Очікує аналізу'],
      ['done', 'Проаналізовано'],
      ['needs_review', 'Потребує перевірки'],
      ['error', 'Помилка'],
    ],
  },
  {
    name: 'x_ai_client_type',
    label: 'AI: тип клієнта',
    type: 'selection',
    options: [
      ['residential', 'Приватний клієнт'],
      ['commercial', 'Комерційний'],
      ['developer', 'Девелопер / ЖК'],
      ['partner', 'Партнер (дизайнер, архітектор)'],
      ['unknown', 'Невідомо'],
    ],
  },
  {
    name: 'x_ai_priority',
    label: 'AI: рекомендований пріоритет',
    type: 'selection',
    options: [
      ['high', 'Високий'],
      ['medium', 'Середній'],
      ['low', 'Низький'],
    ],
  },
  { name: 'x_ai_services', label: 'AI: потрібні послуги', type: 'char' },
  { name: 'x_ai_budget_usd', label: 'AI: бюджет, USD', type: 'float' },
  { name: 'x_ai_timeline', label: 'AI: строки', type: 'char' },
  { name: 'x_ai_summary', label: 'AI: короткий опис', type: 'text' },
  { name: 'x_ai_missing', label: 'AI: відсутні дані', type: 'char' },
  { name: 'x_ai_next_action', label: 'AI: наступна дія', type: 'char' },
  { name: 'x_ai_reply_draft', label: 'AI: чернетка відповіді', type: 'text' },
  { name: 'x_ai_raw', label: 'AI: сирий JSON', type: 'text' },
];
