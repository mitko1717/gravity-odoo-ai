// Ukrainian -> English names of records already in Odoo. Seeds find records by name, so existing records are
// renamed first (npm run translate:records) to avoid duplicates. Grows with each translated group.
export type RenamePair = [model: string, field: string, uk: string, en: string];

const STAGES: RenamePair[] = [
  ['project.task.type', 'name', 'До виконання', 'To do'],
  ['project.task.type', 'name', 'В роботі', 'In progress'],
  ['project.task.type', 'name', 'На перевірці', 'In review'],
  ['project.task.type', 'name', 'Готово', 'Done'],
];

const TASKS: RenamePair[] = [
  ['Уточнення технічних вимог', 'Clarify technical requirements'],
  ['Виїзд на об’єкт', 'Site visit'],
  ['Проєктування', 'System design'],
  ['Погодження специфікації з клієнтом', 'Specification approval with client'],
  ['Закупівля обладнання', 'Equipment purchasing'],
  ['Монтаж', 'Installation'],
  ['Налаштування та програмування', 'Configuration and programming'],
  ['Тестування системи', 'System testing'],
  ['Здача клієнту та навчання', 'Handover and client training'],
].map(([uk, en]) => ['project.task', 'name', uk ?? '', en ?? '']);

const PRODUCTS: RenamePair[] = [
  ['Впровадження «Розумний дім» (пакет робіт) [демо-ціна]', 'Smart home implementation (work package) [demo price]'],
  ['Виїзд інженера та обстеження об’єкта [демо-ціна]', 'Engineer site visit and survey [demo price]'],
  ['Проєктування системи розумного дому [демо-ціна]', 'Smart home system design [demo price]'],
  ['Електромонтажні роботи [демо-ціна]', 'Electrical installation works [demo price]'],
  ['Налаштування та програмування системи [демо-ціна]', 'System configuration and programming [demo price]'],
  ['Комплект обладнання (умовна позиція) [демо-ціна]', 'Equipment kit (placeholder item) [demo price]'],
  ['KNX актуатор 8-канальний [демо-ціна]', 'KNX actuator, 8-channel [demo price]'],
  ['KNX блок живлення 640 mA [демо-ціна]', 'KNX power supply 640 mA [demo price]'],
  ['Датчик присутності KNX [демо-ціна]', 'KNX presence sensor [demo price]'],
  ['Контролер розумного дому [демо-ціна]', 'Smart home controller [demo price]'],
  ['Кабель KNX/EIB, бухта 100 м [демо-ціна]', 'KNX/EIB cable, 100 m reel [demo price]'],
].map(([uk, en]) => ['product.template', 'name', uk ?? '', en ?? '']);

const PARTNERS: RenamePair[] = [
  ['Постачальник KNX (демо)', 'KNX Supplier (demo)'],
  ['Електротехніка Опт (демо)', 'Electro Wholesale (demo)'],
  ['Студія інтер’єру «Демо-Лофт»', 'Interior studio "Demo Loft"'],
  ['Архітектурне бюро «Демо-Арх»', 'Architecture bureau "Demo Arch"'],
  ['Дизайнерка Олена Демо', 'Designer Olena Demo'],
  ['Забудовник «Демо-Буд»', 'Developer "Demo Build"'],
].map(([uk, en]) => ['res.partner', 'name', uk ?? '', en ?? '']);

const MISC: RenamePair[] = [
  ['res.partner.category', 'name', 'Партнер: дизайнер', 'Partner: designer'],
  ['res.partner.category', 'name', 'Партнер: архітектор', 'Partner: architect'],
  ['res.partner.category', 'name', 'Партнер: забудовник', 'Partner: developer'],
  ['project.project', 'name', 'Шаблон: впровадження розумного дому', 'Template: smart home implementation'],
  ['sale.order.template', 'name', 'Розумний дім — базова пропозиція (демо)', 'Smart home: basic proposal (demo)'],
  ['appointment.type', 'name', 'Консультація з інженером (демо)', 'Consultation with an engineer (demo)'],
  ['utm.source', 'name', 'Партнери', 'Partners'],
  ['crm.tag', 'name', 'Сервіс', 'Service'],
  ['knowledge.article', 'name', 'Регламент сервісу та SLA (демо)', 'Service and SLA policy (demo)'],
  ['knowledge.article', 'name', 'Гарантія на роботи та обладнання (демо)', 'Warranty on works and equipment (demo)'],
  ['knowledge.article', 'name', 'Чек-лист монтажу розумного дому (демо)', 'Smart home installation checklist (demo)'],
  ['knowledge.article', 'name', 'Онбординг нового співробітника (демо)', 'New employee onboarding (demo)'],
  ['knowledge.article', 'name', 'Маркетинговий звіт по кампаніях (демо)', 'Marketing campaign report (demo)'],
  ['knowledge.article', 'name', 'Тижневий звіт керівнику (демо)', 'Weekly owner report (demo)'],
  ['ir.actions.server', 'name', 'AI: тижневий звіт керівнику', 'AI: weekly owner report'],
];

// Names searched in every model of NAMED_MODELS (actions, stages, tags, roles and so on).
export const NAMED_MODELS: Array<[model: string, field: string]> = [
  ['ir.actions.server', 'name'],
  ['base.automation', 'name'],
  ['ir.cron', 'cron_name'],
  ['knowledge.article', 'name'],
  ['ai.agent', 'name'],
  ['crm.stage', 'name'],
  ['crm.tag', 'name'],
  ['helpdesk.sla', 'name'],
  ['helpdesk.team', 'name'],
  ['hr.job', 'name'],
  ['hr.employee', 'name'],
  ['planning.role', 'name'],
  ['project.project', 'name'],
  ['project.task.type', 'name'],
  ['project.tags', 'name'],
  ['project.task', 'name'],
  ['sign.template', 'name'],
];

export const NAME_PAIRS: Array<[uk: string, en: string]> = [
  ['Opsline: AI-аналіз кандидата (повторно)', 'Opsline: AI applicant analysis (re-run)'],
  ['Opsline: AI-аналіз кандидата', 'Opsline: AI applicant analysis'],
  ['Opsline: AI-аналіз нової заявки', 'Opsline: AI analysis of a new request'],
  ['Opsline: AI-аналіз ліда', 'Opsline: AI lead analysis'],
  ['Opsline: AI-тріаж сервісного звернення', 'Opsline: AI triage of a service request'],
  ['Opsline: AI-тріаж тікета', 'Opsline: AI ticket triage'],
  ['Opsline: AI-профіль кандидата', 'Opsline: AI applicant profile'],
  ['Opsline: запис на консультацію → лід', 'Opsline: consultation booking → lead'],
  ['Opsline: замовлення підтверджено → рахунок на передоплату', 'Opsline: order confirmed → prepayment invoice'],
  ['Opsline: передоплату отримано → PM запускає закупівлі', 'Opsline: prepayment received → PM starts purchasing'],
  ['Opsline: витрати по об’єктах (демо)', 'Opsline: project expenses (demo)'],
  ['Opsline: тести пройдено → здача клієнту', 'Opsline: tests passed → client handover'],
  ['Opsline: внутрішній асистент (демо)', 'Opsline: internal assistant (demo)'],
  ['Opsline: контакт клієнта з ліда', 'Opsline: client contact from lead'],
  ['Opsline: нагадування про контакт з партнером', 'Opsline: partner contact reminder'],
  ['Opsline: дедлайни задач проєкту', 'Opsline: project task deadlines'],
  ['Opsline: ескалація простроченої задачі', 'Opsline: overdue task escalation'],
  ['Opsline: специфікація погоджена → чернетки RFQ', 'Opsline: specification approved → draft RFQs'],
  ['Opsline: тижневий звіт керівнику', 'Opsline: weekly owner report'],
  ['Управлінський звіт по об’єктах (демо)', 'Management report by project (demo)'],
  ['AI: управлінський звіт', 'AI: management report'],
  ['AI: протокол пусконалагодження', 'AI: commissioning protocol'],
  ['AI: лист клієнту при здачі', 'AI: handover email to client'],
  ['AI: маркетинговий звіт', 'AI: marketing report'],
  ['AI: розібрати нараду', 'AI: process meeting'],
  ['AI: звіт по об’єкту', 'AI: site report'],
  ['AI: чернетка специфікації', 'AI: draft specification'],
  ['Критична: реакція за 2 год', 'Critical: response within 2 h'],
  ['Висока: реакція за 8 год', 'High: response within 8 h'],
  ['Звичайна: реакція за 24 год', 'Normal: response within 24 h'],
  ['Сервіс Opsline (демо)', 'Northwind Service (demo)'],
  ['Монтажник-електрик (демо)', 'Electrician installer (demo)'],
  ['Наради: планування об’єктів (демо)', 'Meetings: project planning (demo)'],
  ['Чернетки з зустрічей', 'Meeting drafts'],
  ['AI-чернетка', 'AI draft'],
  ['Партнер: контакт відбувся', 'Partner: contact made'],
  ['Партнер: останній контакт', 'Partner: last contact'],
  ['Монтажник Андрій (демо)', 'Installer Andrii (demo)'],
  ['Монтажник Богдан (демо)', 'Installer Bohdan (demo)'],
  ['Інженер Віктор (демо)', 'Engineer Viktor (demo)'],
  ['Інженер-налагоджувальник (демо)', 'Commissioning engineer (demo)'],
  ['Монтажник (демо)', 'Installer (demo)'],
  ['Запланувати бригади', 'Plan crews'],
  ['Нова заявка', 'New request'],
  ['Кваліфікована', 'Qualified'],
  ['Консультація / виїзд', 'Consultation / site visit'],
  ['Комерційна пропозиція', 'Quotation'],
  ['Договір підписано', 'Contract signed'],
  ['B2B / ЖК', 'B2B / residential complex'],
  ['Партнерський канал', 'Partner channel'],
  ['AI: потрібна перевірка', 'AI: needs review'],
  ['Розумний дім', 'Smart home'],
  ['Електромонтаж', 'Electrical installation'],
  ['Інженерні системи', 'Engineering systems'],
  ['Теплові насоси', 'Heat pumps'],
  ['Тестування системи', 'System testing'],
  ['Здача клієнту та навчання', 'Handover and client training'],
  ['Заявка з сайту', 'Website request'],
  ['Договір (демо)', 'Contract (demo)'],
  ['Акт приймання (демо)', 'Acceptance certificate (demo)'],
];

// Contacts created for the synthetic eval leads (S01–S18) under their old Ukrainian names.
const EVAL_CLIENTS: RenamePair[] = Array.from({ length: 18 }, (_, index) => {
  const id = `S${String(index + 1).padStart(2, '0')}`;

  return ['res.partner', 'name', `Синтетичний клієнт ${id}`, `Synthetic client ${id}`];
});

export const RENAME_PAIRS: RenamePair[] = [...STAGES, ...TASKS, ...PRODUCTS, ...PARTNERS, ...MISC, ...EVAL_CLIENTS];
