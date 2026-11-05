# Sales order confirmed -> draft 30% prepayment invoice + activity for the manager.
# Nothing is posted or sent automatically: the manager sends the contract (Sign) and the invoice.
for order in records:
    open_invoices = order.invoice_ids.filtered(lambda move: move.state != 'cancel')
    if open_invoices:
        continue

    wizard = env['sale.advance.payment.inv'].with_context(
        active_model='sale.order',
        active_ids=order.ids,
        active_id=order.id,
    ).create({'advance_payment_method': 'percentage', 'amount': 30})
    wizard.create_invoices()

    invoice = order.invoice_ids.filtered(lambda move: move.state == 'draft')[:1]
    invoice_name = invoice.display_name or '-'
    order.message_post(body='Створено чернетку рахунку на передоплату 30%%: %s. Рахунок не проведено і не надіслано клієнту.' % invoice_name)

    manager_id = order.user_id.id or env.user.id
    order.activity_schedule(
        'mail.mail_activity_data_todo',
        summary='Надіслати договір на підпис і рахунок на передоплату',
        note='Договір: Sign → шаблон «Договір (демо)». Рахунок: %s — перевірити й провести.' % invoice_name,
        user_id=manager_id,
    )
