# Odoo server action (AI tool). Creates the checklist as sub-tasks of «System testing»; idempotent.
if record.child_ids:
    ai['result'] = 'checklist already exists: %d sub-tasks, nothing created' % len(record.child_ids)
else:
    created = 0
    for check in (checks or [])[:15]:
        text = (check.get('check') or '').strip()
        if not text:
            continue
        env['project.task'].create({
            'name': 'Check [%s]: %s' % ((check.get('subsystem') or 'General')[:40], text[:200]),
            'parent_id': record.id,
            'project_id': record.project_id.id,
        })
        created += 1
    record.message_post(body='AI commissioning protocol: %d checks created (sub-tasks). The engineer closes each after checking.' % created)
    ai['result'] = 'created %d checks' % created
