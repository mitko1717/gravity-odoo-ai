# Odoo server action (AI tool). Saves the email draft into the handover task; nothing is sent.
handover = record.task_ids.filtered(lambda t: t.name == 'Здача клієнту та навчання')[:1]
paragraphs = ['<p>%s</p>' % part.replace('\n', '<br/>') for part in (body_uk or '').split('\n\n') if part.strip()]
html = '<p><b>AI-чернетка листа клієнту</b> (PM перевіряє й надсилає сам)</p><p><b>Тема:</b> %s</p>%s' % (subject_uk or '', ''.join(paragraphs))
target = handover or record
target.write({'description': html})
target.message_post(body='AI-чернетку листа клієнту збережено в описі задачі. Нічого не надіслано.')
ai['result'] = 'draft saved'
