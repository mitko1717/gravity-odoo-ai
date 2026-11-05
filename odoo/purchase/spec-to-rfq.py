# Automation (project.task, stage set to «Готово» on the spec approval task):
# create draft RFQs per vendor from the customer's order equipment. Nothing is sent to vendors.
for task in records:
    order = task.project_id.sale_order_id
    if not order:
        task.message_post(body='Закупівля: до проєкту не прив’язане замовлення клієнта, RFQ не створено.')
        continue

    existing = env['purchase.order'].search([('origin', '=', order.name), ('state', 'in', ['draft', 'sent'])])
    if existing:
        task.message_post(body='Закупівля: чернетки RFQ для %s вже існують (%s), нові не створено.' % (order.name, ', '.join(existing.mapped('name'))))
        continue

    by_vendor = {}
    without_vendor = []
    for line in order.order_line:
        product = line.product_id
        seller = product.seller_ids[:1]
        if not seller:
            if product.type == 'consu':
                without_vendor.append(product.display_name)
            continue
        by_vendor.setdefault(seller.partner_id.id, []).append((0, 0, {
            'product_id': product.id,
            'product_qty': line.product_uom_qty,
            'price_unit': seller.price,
        }))

    buyer = task.project_id.user_id or env.user
    names = []
    for vendor_id in by_vendor:
        rfq = env['purchase.order'].create({'partner_id': vendor_id, 'origin': order.name, 'order_line': by_vendor[vendor_id]})
        rfq.activity_schedule('mail.mail_activity_data_todo', summary='Перевірити й надіслати RFQ постачальнику', user_id=buyer.id)
        names.append(rfq.name)

    note = 'Закупівля: створено чернетки RFQ: %s.' % (', '.join(names) or 'немає позицій з постачальником')
    if without_vendor:
        note += ' Без постачальника (потрібна ручна закупівля): ' + ', '.join(without_vendor)
    task.message_post(body=note)
