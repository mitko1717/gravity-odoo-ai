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
    order.message_post(body='Draft 30%% prepayment invoice created: %s. The invoice is not posted and not sent to the client.' % invoice_name)

    manager_id = order.user_id.id or env.user.id
    order.activity_schedule(
        'mail.mail_activity_data_todo',
        summary='Send the contract for signature and the prepayment invoice',
        note='Contract: Sign → template «Contract (demo)». Invoice: %s, review and post it.' % invoice_name,
        user_id=manager_id,
    )
