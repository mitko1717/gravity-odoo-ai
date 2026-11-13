# Automation (project.task, 1 day after deadline): escalate an unfinished task to the project manager.
for task in records:
    manager = task.project_id.user_id or env.ref('base.user_admin')
    task.activity_schedule(
        'mail.mail_activity_data_todo',
        summary=('Overdue: ' + task.name)[:100],
        note='The task deadline has passed. Check the status and blockers, or move the deadline.',
        user_id=manager.id,
    )
    task.message_post(body='The task is overdue. Escalated to the project manager: %s.' % manager.name)
