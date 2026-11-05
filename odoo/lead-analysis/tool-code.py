# Odoo server action (AI tool). Schema properties are injected as local variables.
# Validates the LLM output and writes it onto the lead; the LLM never writes fields directly.
CLIENT_TYPES = ['residential', 'commercial', 'developer', 'partner', 'unknown']
PRIORITIES = ['high', 'medium', 'low']
SERVICE_TAGS = {
    'smart_home': 'Розумний дім', 'lighting': 'Розумний дім', 'climate': 'Розумний дім',
    'security': 'Розумний дім', 'electrical': 'Електромонтаж', 'engineering': 'Інженерні системи',
    'heat_pump': 'Теплові насоси', 'service': 'Сервіс',
}
DEMO_USD_RATES = {'USD': 1.0, 'EUR': 1.08, 'UAH': 0.024}
DEADLINE_DAYS = {'high': 0, 'medium': 1, 'low': 3}

problems = []

safe_client_type = client_type if client_type in CLIENT_TYPES else 'unknown'
if safe_client_type != client_type:
    problems.append('client_type')

safe_priority = priority if priority in PRIORITIES else 'medium'
if safe_priority != priority:
    problems.append('priority')

safe_services = [s for s in (services or []) if s in SERVICE_TAGS or s == 'other']
safe_area = float(area_m2 or 0)
if safe_area < 0 or safe_area > 100000:
    problems.append('area_m2')
    safe_area = 0.0

usd_rate = DEMO_USD_RATES.get(budget_currency, 0.0)
budget_usd = round(float(budget_amount or 0) * usd_rate, 2)
if budget_usd < 0:
    problems.append('budget')
    budget_usd = 0.0

contact_filters = []
if record.email_from:
    contact_filters.append(('email_from', '=ilike', record.email_from))
if record.phone:
    contact_filters.append(('phone', '=', record.phone))

duplicates = env['crm.lead']
if contact_filters:
    duplicate_domain = [('id', '!=', record.id)] + ['|'] * (len(contact_filters) - 1) + contact_filters
    duplicates = env['crm.lead'].with_context(active_test=False).search(duplicate_domain, limit=5)

tag_names = set(SERVICE_TAGS[s] for s in safe_services if s in SERVICE_TAGS)
if safe_client_type in ('developer', 'commercial'):
    tag_names.add('B2B / ЖК')
if safe_client_type == 'partner':
    tag_names.add('Партнерський канал')

needs_review = bool(problems) or bool(duplicates)
if needs_review:
    tag_names.add('AI: потрібна перевірка')

tags = env['crm.tag'].search([('name', 'in', list(tag_names))])
missing_text = ', '.join(missing_fields or [])

record.write({
    'x_ai_status': 'needs_review' if needs_review else 'done',
    'x_ai_client_type': safe_client_type,
    'x_ai_priority': safe_priority,
    'x_ai_services': ', '.join(safe_services),
    'x_ai_budget_usd': budget_usd,
    'x_ai_timeline': (timeline or '')[:200],
    'x_ai_summary': summary_uk or '',
    'x_ai_missing': missing_text,
    'x_ai_next_action': (next_action_uk or '')[:250],
    'x_ai_reply_draft': reply_draft_uk or '',
    'x_ai_raw': repr({
        'client_type': client_type, 'services': services, 'area_m2': area_m2,
        'budget_amount': budget_amount, 'budget_currency': budget_currency, 'location': location,
        'timeline': timeline, 'priority': priority, 'missing_fields': missing_fields,
        'validation_problems': problems, 'duplicate_ids': duplicates.ids,
    }),
    'tag_ids': [(4, tag.id) for tag in tags],
})

deadline = datetime.date.today() + datetime.timedelta(days=DEADLINE_DAYS[safe_priority])
record.activity_schedule(
    'mail.mail_activity_data_todo',
    date_deadline=deadline,
    summary=('AI: ' + (next_action_uk or 'Зв’язатися з клієнтом'))[:100],
    note=summary_uk or '',
    user_id=record.user_id.id or env.user.id,
)

note_lines = ['AI-аналіз заявки (рекомендація, потребує підтвердження менеджером).']
if duplicates:
    note_lines.append('Можливі дублікати: ' + ', '.join('#%s %s' % (d.id, d.name) for d in duplicates))
if problems:
    note_lines.append('Відхилені значення AI: ' + ', '.join(problems))
if missing_text:
    note_lines.append('Бракує даних: ' + missing_text)
record.message_post(body='\n'.join(note_lines))

ai['result'] = 'saved: status=%s, priority=%s' % (record.x_ai_status, safe_priority)
