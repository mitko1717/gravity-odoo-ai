import type { FieldSpec } from '../ensure.js';

export const TICKET_AI_FIELDS: FieldSpec[] = [
  {
    name: 'x_ai_status',
    label: 'AI: status',
    type: 'selection',
    options: [['done', 'Analyzed'], ['needs_review', 'Needs review']],
  },
  {
    name: 'x_ai_category',
    label: 'AI: system',
    type: 'selection',
    options: [
      ['lighting', 'Lighting / scenes'],
      ['climate', 'Climate / heating'],
      ['security', 'Security / CCTV'],
      ['network', 'Network / controller / app'],
      ['electrical', 'Electrical'],
      ['heat_pump', 'Heat pump'],
      ['other', 'Other'],
    ],
  },
  {
    name: 'x_ai_urgency',
    label: 'AI: urgency',
    type: 'selection',
    options: [['critical', 'Critical'], ['high', 'High'], ['normal', 'Normal'], ['low', 'Low']],
  },
  { name: 'x_ai_summary', label: 'AI: issue summary', type: 'text' },
  { name: 'x_ai_next_action', label: 'AI: next action', type: 'char' },
  { name: 'x_ai_reply_draft', label: 'AI: reply draft', type: 'text' },
];
