# Odoo server action (AI tool). Validates the analysis and writes AI fields only. Never changes stage.
FITS = ['strong', 'possible', 'weak', 'unclear']

problems = []
safe_fit = fit if fit in FITS else 'unclear'
if safe_fit != fit:
    problems.append('fit')

values = {
    'x_ai_status': 'needs_review' if problems else 'done',
    'x_ai_fit': safe_fit,
    'x_ai_profile': profile_uk or '',
    'x_ai_skills': (skills_uk or '')[:250],
    'x_ai_gaps': gaps_uk or '',
    'x_ai_questions': questions_uk or '',
    'x_ai_next_action': (next_action_uk or '')[:250],
}
record.write(values)

note = 'AI-профіль кандидата: відповідність «%s» (рекомендація). Рішення ухвалює рекрутер, етап не змінено.' % safe_fit
if problems:
    note += ' Відхилені значення AI: ' + ', '.join(problems)
record.message_post(body=note)

ai['result'] = 'saved: %s' % safe_fit
