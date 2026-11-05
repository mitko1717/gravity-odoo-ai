# Odoo server action (AI tool). Creates the checklist as sub-tasks of «Тестування системи»; idempotent.
if record.child_ids:
    ai['result'] = 'checklist already exists: %d sub-tasks, nothing created' % len(record.child_ids)
else:
    created = 0
    for check in (checks or [])[:15]:
        text = (check.get('check_uk') or '').strip()
        if not text:
            continue
        env['project.task'].create({
            'name': 'Перевірка [%s]: %s' % ((check.get('subsystem_uk') or 'Загальне')[:40], text[:200]),
            'parent_id': record.id,
            'project_id': record.project_id.id,
        })
        created += 1
    record.message_post(body='AI-протокол пусконалагодження: створено %d перевірок (підзадачі). Інженер закриває кожну після перевірки.' % created)
    ai['result'] = 'created %d checks' % created
