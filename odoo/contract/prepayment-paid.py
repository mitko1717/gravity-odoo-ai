# Customer invoice paid -> tell the project manager that procurement can start.
for move in records:
    orders = move.line_ids.sale_line_ids.order_id
    for order in orders:
        for project in order.project_ids:
            project.message_post(body='Prepayment for %s received (%s). Purchasing can start.' % (order.name, move.display_name))

            pm_id = project.user_id.id or order.user_id.id or env.user.id
            project.activity_schedule(
                'mail.mail_activity_data_todo',
                summary='Prepayment received: start purchasing',
                user_id=pm_id,
            )
