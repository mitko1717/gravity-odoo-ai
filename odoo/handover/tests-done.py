# Automation (project.task «Тестування системи» → «Готово»): gate for the handover.
for task in records:
    open_checks = task.child_ids.filtered(lambda child: child.state not in ('1_done', '1_canceled'))
    if open_checks:
        review_stage = task.project_id.type_ids.filtered(lambda stage: stage.name == 'На перевірці')[:1]
        if review_stage:
            task.write({'stage_id': review_stage.id})
        task.message_post(body='Здача заблокована: відкрито перевірок пусконалагодження: %d. Задачу повернуто «На перевірці». Закрийте перевірки перед передачею клієнту.' % len(open_checks))
        continue

    handover = task.project_id.task_ids.filtered(lambda t: t.name == 'Здача клієнту та навчання')[:1] or task
    pm_id = task.project_id.user_id.id or env.user.id
    handover.activity_schedule(
        'mail.mail_activity_data_todo',
        summary='Тести пройдено: надіслати акт приймання (Sign) і лист клієнту',
        note='Акт: Sign → шаблон «Акт приймання (демо)». Лист: кнопка «AI: лист клієнту при здачі» в проєкті.',
        user_id=pm_id,
    )
    task.message_post(body='Усі перевірки закрито (%d). PM отримав задачу на здачу об’єкта.' % len(task.child_ids))
