# Odoo server action (AI tool). Validates the analysis and writes AI fields only. Never changes stage.
FITS = ['strong', 'possible', 'weak', 'unclear']

problems = []
safe_fit = fit if fit in FITS else 'unclear'
if safe_fit != fit:
    problems.append('fit')

values = {
    'x_ai_status': 'needs_review' if problems else 'done',
    'x_ai_fit': safe_fit,
    'x_ai_profile': profile or '',
    'x_ai_skills': (skills or '')[:250],
    'x_ai_gaps': gaps or '',
    'x_ai_questions': questions or '',
    'x_ai_next_action': (next_action or '')[:250],
}
record.write(values)

note = 'AI candidate profile: fit «%s» (a recommendation). The recruiter decides; the stage is unchanged.' % safe_fit
if problems:
    note += ' Rejected AI values: ' + ', '.join(problems)
record.message_post(body=note)

ai['result'] = 'saved: %s' % safe_fit
