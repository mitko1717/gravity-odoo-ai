import type { FieldSpec } from '../ensure.js';

export const APPLICANT_AI_FIELDS: FieldSpec[] = [
  {
    name: 'x_ai_status',
    label: 'AI: status',
    type: 'selection',
    options: [['done', 'Analyzed'], ['needs_review', 'Needs review']],
  },
  {
    name: 'x_ai_fit',
    label: 'AI: job fit (recommendation)',
    type: 'selection',
    options: [['strong', 'Strong'], ['possible', 'Possible'], ['weak', 'Weak'], ['unclear', 'Not enough data']],
  },
  { name: 'x_ai_profile', label: 'AI: candidate profile', type: 'text' },
  { name: 'x_ai_skills', label: 'AI: key skills', type: 'char' },
  { name: 'x_ai_gaps', label: 'AI: gaps / missing data', type: 'text' },
  { name: 'x_ai_questions', label: 'AI: interview questions', type: 'text' },
  { name: 'x_ai_next_action', label: 'AI: recommendation to recruiter', type: 'char' },
];
