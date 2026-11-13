import type { FieldSpec } from '../ensure.js';

export const FORM_FIELDS: FieldSpec[] = [
  {
    name: 'x_object_type',
    label: 'Property type',
    type: 'selection',
    options: [
      ['apartment', 'Apartment'],
      ['house', 'House'],
      ['townhouse', 'Townhouse'],
      ['commercial', 'Commercial property'],
      ['residential_complex', 'Residential complex'],
      ['cottage_town', 'Cottage community'],
    ],
  },
  { name: 'x_city', label: 'City', type: 'char' },
  { name: 'x_area_m2', label: 'Area, m²', type: 'float' },
  {
    name: 'x_service',
    label: 'Service',
    type: 'selection',
    options: [
      ['smart_home', 'Smart home'],
      ['electrical', 'Electrical installation'],
      ['engineering', 'Engineering systems'],
      ['heat_pump', 'Heat pumps'],
      ['service', 'Service / maintenance'],
      ['other', 'Other / not sure'],
    ],
  },
  { name: 'x_budget_text', label: 'Budget (client wording)', type: 'char' },
];

export const AI_FIELDS: FieldSpec[] = [
  {
    name: 'x_ai_status',
    label: 'AI: status',
    type: 'selection',
    options: [
      ['pending', 'Awaiting analysis'],
      ['done', 'Analyzed'],
      ['needs_review', 'Needs review'],
      ['error', 'Error'],
    ],
  },
  {
    name: 'x_ai_client_type',
    label: 'AI: client type',
    type: 'selection',
    options: [
      ['residential', 'Private client'],
      ['commercial', 'Commercial'],
      ['developer', 'Developer / residential complex'],
      ['partner', 'Partner (designer, architect)'],
      ['unknown', 'Unknown'],
    ],
  },
  {
    name: 'x_ai_priority',
    label: 'AI: suggested priority',
    type: 'selection',
    options: [
      ['high', 'High'],
      ['medium', 'Medium'],
      ['low', 'Low'],
    ],
  },
  { name: 'x_ai_services', label: 'AI: services needed', type: 'char' },
  { name: 'x_ai_budget_usd', label: 'AI: budget, USD', type: 'float' },
  { name: 'x_ai_timeline', label: 'AI: timeline', type: 'char' },
  { name: 'x_ai_summary', label: 'AI: summary', type: 'text' },
  { name: 'x_ai_missing', label: 'AI: missing data', type: 'char' },
  { name: 'x_ai_next_action', label: 'AI: next action', type: 'char' },
  { name: 'x_ai_reply_draft', label: 'AI: reply draft', type: 'text' },
  { name: 'x_ai_raw', label: 'AI: raw JSON', type: 'text' },
];
