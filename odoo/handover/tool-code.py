# Odoo server action (AI tool). Saves the email draft into the handover task; nothing is sent.
handover = record.task_ids.filtered(lambda t: t.name == 'Здача клієнту та навчання')[:1]
test_task = record.task_ids.filtered(lambda t: t.name == 'Тестування системи')[:1]
open_checks = test_task.child_ids.filtered(lambda child: child.state not in ('1_done', '1_canceled'))
subject_uk = (subject_uk or '').replace('{{project}}', record.name or '').replace('{project}', record.name or '')
paragraphs = ['<p>%s</p>' % part.replace('\n', '<br/>') for part in (body_uk or '').split('\n\n') if part.strip()]
html = '<p><b>AI-чернетка листа клієнту</b> (PM перевіряє й надсилає сам)</p><p><b>Тема:</b> %s</p>%s' % (subject_uk or '', ''.join(paragraphs))
target = handover or record
if open_checks:
    html = '<p><b>⚠ Пусконалагодження не завершено:</b> відкритих перевірок %d. Перегенеруйте лист після «Тести пройдено».</p>%s' % (len(open_checks), html)
target.write({'description': html})
target.message_post(body='AI-чернетку листа клієнту збережено в описі задачі. Нічого не надіслано.')
ai['result'] = 'draft saved'
