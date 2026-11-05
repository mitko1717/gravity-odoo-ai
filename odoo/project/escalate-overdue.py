# Automation (project.task, 1 day after deadline): escalate an unfinished task to the project manager.
for task in records:
    manager = task.project_id.user_id or env.ref('base.user_admin')
    task.activity_schedule(
        'mail.mail_activity_data_todo',
        summary=('Прострочено: ' + task.name)[:100],
        note='Дедлайн задачі минув. Перевірте статус, заблокованість або перенесіть строк.',
        user_id=manager.id,
    )
    task.message_post(body='Задача прострочена. Ескалацію надіслано керівнику проєкту: %s.' % manager.name)
