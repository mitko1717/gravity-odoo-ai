# Server action (project.project button «Plan crews»): draft Planning shifts for field tasks.
# Durations and roles are demo assumptions. Shifts stay drafts: nobody is notified until the PM publishes them.
PLAN = [
    ('Site visit', 'Commissioning engineer (demo)', 1),
    ('Installation', 'Installer (demo)', 5),
    ('Configuration and programming', 'Commissioning engineer (demo)', 3),
    ('System testing', 'Commissioning engineer (demo)', 1),
    ('Handover and client training', 'Commissioning engineer (demo)', 1),
]

for project in records:
    created = 0
    skipped = []
    for task_name, role_name, days in PLAN:
        task = project.task_ids.filtered(lambda t: t.name == task_name)[:1]
        role = env['planning.role'].search([('name', '=', role_name)], limit=1)
        if not task or not task.date_deadline or not role:
            skipped.append(task_name)
            continue

        slot_name = '%s — %s' % (project.name, task_name)
        if env['planning.slot'].search_count([('name', '=', slot_name)]):
            skipped.append(task_name)
            continue

        end_day = task.date_deadline.date()
        start_day = end_day - datetime.timedelta(days=days - 1)
        env['planning.slot'].create({
            'name': slot_name,
            'role_id': role.id,
            'resource_ids': [(6, 0, role.resource_ids[:2].ids)],
            'start_datetime': datetime.datetime.combine(start_day, datetime.time(7, 0)),
            'end_datetime': datetime.datetime.combine(end_day, datetime.time(15, 0)),
            'sale_order_id': project.sale_order_id.id or False,
        })
        created += 1

    slots = env['planning.slot'].search([('name', 'like', project.name + ' — ')])
    conflicts = len(slots.filtered(lambda s: s.overlap_slot_count > 0))
    project.message_post(body='Planning: draft shifts created: %d; skipped: %s; overlapping shifts: %d. Review and publish them in Planning.' % (
        created, ', '.join(skipped) or 'none', conflicts))
