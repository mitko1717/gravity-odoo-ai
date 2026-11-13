export const PROJECT_TEMPLATE_NAME = 'Template: smart home implementation';

export const TASK_STAGES = ['To do', 'In progress', 'In review', 'Done'];

export const TEMPLATE_TASKS = [
  'Clarify technical requirements',
  'Site visit',
  'System design',
  'Specification approval with client',
  'Equipment purchasing',
  'Installation',
  'Configuration and programming',
  'System testing',
  'Handover and client training',
];

export interface ServiceProduct {
  name: string;
  price: number;
  uom?: 'Units' | 'm²';
  createsProject?: boolean;
}

export const PRODUCTS: ServiceProduct[] = [
  { name: 'Smart home implementation (work package) [demo price]', price: 1, createsProject: true },
  { name: 'Engineer site visit and survey [demo price]', price: 2500 },
  { name: 'Smart home system design [demo price]', price: 30000 },
  { name: 'Electrical installation works [demo price]', price: 60000 },
  { name: 'System configuration and programming [demo price]', price: 25000 },
  { name: 'Equipment kit (placeholder item) [demo price]', price: 250000 },
];

export const QUOTATION_TEMPLATE_NAME = 'Smart home: basic proposal (demo)';
