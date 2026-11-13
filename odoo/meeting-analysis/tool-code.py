# Odoo server action (AI tool). Creates draft tasks for PM confirmation; never assigns users.
MAX_ITEMS = 15

stage = env['project.task.type'].search([('name', '=', 'Meeting drafts'), ('project_ids', 'in', record.ids)], limit=1)
tag = env['project.tags'].search([('name', '=', 'AI draft')], limit=1)

created = []
bad_dates = 0
for item in (action_items or [])[:MAX_ITEMS]:
    title = (item.get('title') or '').strip()
    if not title:
        continue

    deadline = False
    raw_date = (item.get('due_date') or '').strip()
    if raw_date:
        try:
            deadline = datetime.datetime.strptime(raw_date, '%Y-%m-%d')
        except ValueError:
            bad_dates += 1

    owner = item.get('owner_name') or 'not stated'
    description = '<p>Owner per transcript: %s</p><p>%s</p><p><i>AI draft: the PM confirms the owner and the deadline.</i></p>' % (owner, item.get('details') or '')
    task = env['project.task'].create({
        'name': title[:200],
        'project_id': record.id,
        'stage_id': stage.id or False,
        'tag_ids': [(6, 0, tag.ids)],
        'date_deadline': deadline,
        'description': description,
        'user_ids': [(6, 0, [])],
    })
    created.append(task.id)

summary = (summary or '') + '\n\nDecisions:\n' + (decisions or '')
record.write({'x_meeting_summary': summary})

note = 'AI processed the meeting: %d draft tasks in the «Meeting drafts» stage.' % len(created)
if bad_dates:
    note += ' Invalid dates dropped: %d.' % bad_dates
record.message_post(body=note)

ai['result'] = 'created %d draft tasks' % len(created)
