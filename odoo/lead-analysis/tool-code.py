# Odoo server action (AI tool). Schema properties are injected as local variables.
# Validates the LLM output and writes it onto the lead; the LLM never writes fields directly.
CLIENT_TYPES = ['residential', 'commercial', 'developer', 'partner', 'unknown']
PRIORITIES = ['high', 'medium', 'low']
SERVICE_TAGS = {
    'smart_home': 'Smart home', 'lighting': 'Smart home', 'climate': 'Smart home',
    'security': 'Smart home', 'electrical': 'Electrical installation', 'engineering': 'Engineering systems',
    'heat_pump': 'Heat pumps', 'service': 'Service',
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

# Rule: the form area and the area the AI read from the text must agree (within 10%), otherwise a person checks.
form_area = float(record.x_area_m2 or 0)
if form_area > 0 and safe_area > 0 and abs(form_area - safe_area) > 0.1 * max(form_area, safe_area):
    problems.append('area_conflict (form %d vs text %d)' % (form_area, safe_area))

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
    tag_names.add('B2B / residential complex')
if safe_client_type == 'partner':
    tag_names.add('Partner channel')

needs_review = bool(problems) or bool(duplicates)
if needs_review:
    tag_names.add('AI: needs review')

tags = env['crm.tag'].search([('name', 'in', list(tag_names))])

DEFAULT_TITLES = ['Website request', '']
owner = record.user_id
if not owner:
    team = record.team_id or env['crm.team'].search([], limit=1)
    owner = team.user_id or env.ref('base.user_admin')
    record.write({'user_id': owner.id, 'team_id': team.id})
if (record.name or '') in DEFAULT_TITLES and title:
    record.write({'name': title[:60]})
# Rule over AI: fields filled in the form are never reported as missing (the model sometimes lists them anyway).
filled_by_form = {
    'phone_or_email': bool(record.email_from or record.phone),
    'object_type': bool(record.x_object_type),
    'location': bool(record.x_city),
    'area': bool(record.x_area_m2),
}
missing_fields = [field for field in (missing_fields or []) if not filled_by_form.get(field)]
missing_text = ', '.join(missing_fields)

record.write({
    'x_ai_status': 'needs_review' if needs_review else 'done',
    'x_ai_client_type': safe_client_type,
    'x_ai_priority': safe_priority,
    'x_ai_services': ', '.join(safe_services),
    'x_ai_budget_usd': budget_usd,
    'x_ai_timeline': (timeline or '')[:200],
    'x_ai_summary': summary or '',
    'x_ai_missing': missing_text,
    'x_ai_next_action': (next_action or '')[:250],
    'x_ai_reply_draft': reply_draft or '',
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
    summary=('AI: ' + (next_action or 'Contact the client'))[:100],
    note=summary or '',
    user_id=owner.id,
)

note_lines = ['AI analysis of the request (a recommendation, the manager confirms it).']
if duplicates:
    note_lines.append('Possible duplicates: ' + ', '.join('#%s %s' % (d.id, d.name) for d in duplicates))
if problems:
    note_lines.append('Rejected AI values: ' + ', '.join(problems))
if missing_text:
    note_lines.append('Missing data: ' + missing_text)
record.message_post(body='\n'.join(note_lines))

ai['result'] = 'saved: status=%s, priority=%s' % (record.x_ai_status, safe_priority)
