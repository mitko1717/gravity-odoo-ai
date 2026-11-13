# Odoo server action (AI tool). Validates the triage and applies priority (drives the SLA) and assignee.
CATEGORIES = ['lighting', 'climate', 'security', 'network', 'electrical', 'heat_pump', 'other']
URGENCY_TO_PRIORITY = {'critical': '3', 'high': '2', 'normal': '1', 'low': '0'}

problems = []
safe_category = category if category in CATEGORIES else 'other'
if safe_category != category:
    problems.append('category')

safe_urgency = urgency if urgency in URGENCY_TO_PRIORITY else 'normal'
if safe_urgency != urgency:
    problems.append('urgency')

values = {
    'x_ai_status': 'needs_review' if problems else 'done',
    'x_ai_category': safe_category,
    'x_ai_urgency': safe_urgency,
    'x_ai_summary': summary or '',
    'x_ai_next_action': (next_action or '')[:250],
    'x_ai_reply_draft': reply_draft or '',
    'priority': URGENCY_TO_PRIORITY[safe_urgency],
}
if not record.user_id:
    engineer = record.team_id.member_ids[:1] or env.ref('base.user_admin')
    values['user_id'] = engineer.id

record.write(values)

note = 'AI triage: %s / %s. Priority and SLA were set automatically; the engineer can change them.' % (safe_category, safe_urgency)
if problems:
    note += ' Rejected AI values: ' + ', '.join(problems)
record.message_post(body=note)

ai['result'] = 'saved: %s/%s' % (safe_category, safe_urgency)
