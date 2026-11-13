# Odoo server action (AI tool). Saves the email draft into the handover task; nothing is sent.
handover = record.task_ids.filtered(lambda t: t.name == 'Handover and client training')[:1]
test_task = record.task_ids.filtered(lambda t: t.name == 'System testing')[:1]
open_checks = test_task.child_ids.filtered(lambda child: child.state not in ('1_done', '1_canceled'))
subject = (subject or '').replace('{{project}}', record.name or '').replace('{project}', record.name or '')
paragraphs = ['<p>%s</p>' % part.replace('\n', '<br/>') for part in (body or '').split('\n\n') if part.strip()]
html = '<p><b>AI draft email to the client</b> (the PM reviews and sends it)</p><p><b>Subject:</b> %s</p>%s' % (subject or '', ''.join(paragraphs))
target = handover or record
if open_checks:
    html = '<p><b>⚠ Commissioning not finished:</b> open checks: %d. Regenerate the email after «Tests passed».</p>%s' % (len(open_checks), html)
target.write({'description': html})
target.message_post(body='AI draft email to the client saved in the task description. Nothing was sent.')
ai['result'] = 'draft saved'
