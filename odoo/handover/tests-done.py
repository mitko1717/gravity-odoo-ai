# Automation (project.task «System testing» → «Done»): gate for the handover.
for task in records:
    open_checks = task.child_ids.filtered(lambda child: child.state not in ('1_done', '1_canceled'))
    if open_checks:
        review_stage = task.project_id.type_ids.filtered(lambda stage: stage.name == 'In review')[:1]
        if review_stage:
            task.write({'stage_id': review_stage.id})
        task.message_post(body='Handover blocked: open commissioning checks: %d. The task is moved back to «In review». Close the checks before handing over to the client.' % len(open_checks))
        continue

    handover = task.project_id.task_ids.filtered(lambda t: t.name == 'Handover and client training')[:1] or task
    pm_id = task.project_id.user_id.id or env.user.id
    handover.activity_schedule(
        'mail.mail_activity_data_todo',
        summary='Tests passed: send the acceptance certificate (Sign) and the email to the client',
        note='Certificate: Sign → template «Acceptance certificate (demo)». Email: button «AI: handover email to client» in the project.',
        user_id=pm_id,
    )
    task.message_post(body='All checks closed (%d). The PM got the handover task.' % len(task.child_ids))
