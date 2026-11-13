# Automation (project.task, stage set to «Done» on the spec approval task):
# create draft RFQs per vendor from the customer's order equipment. Nothing is sent to vendors.
for task in records:
    order = task.project_id.sale_order_id
    if not order:
        task.message_post(body='Purchasing: no sales order is linked to the project, no RFQ created.')
        continue

    existing = env['purchase.order'].search([('origin', '=', order.name), ('state', 'in', ['draft', 'sent'])])
    if existing:
        task.message_post(body='Purchasing: draft RFQs for %s already exist (%s), no new ones created.' % (order.name, ', '.join(existing.mapped('name'))))
        continue

    # Approved specification (x_spec_lines, from the AI draft checked by the engineer) wins over order lines.
    spec_lines = []
    for raw in (task.project_id.x_spec_lines or '').split('\n'):
        parts = raw.split(';')
        if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
            spec_lines.append((env['product.product'].browse(int(parts[0])), int(parts[1])))
    if not spec_lines:
        spec_lines = [(line.product_id, line.product_uom_qty) for line in order.order_line]

    by_vendor = {}
    without_vendor = []
    for product, qty in spec_lines:
        seller = product.seller_ids[:1]
        if not seller:
            if product.type == 'consu':
                without_vendor.append(product.display_name)
            continue
        by_vendor.setdefault(seller.partner_id.id, []).append((0, 0, {
            'product_id': product.id,
            'product_qty': qty,
            'price_unit': seller.price,
        }))

    buyer = task.project_id.user_id or env.user
    names = []
    for vendor_id in by_vendor:
        rfq = env['purchase.order'].create({'partner_id': vendor_id, 'origin': order.name, 'order_line': by_vendor[vendor_id]})
        rfq.activity_schedule('mail.mail_activity_data_todo', summary='Review and send the RFQ to the vendor', user_id=buyer.id)
        names.append(rfq.name)

    note = 'Purchasing: draft RFQs created: %s.' % (', '.join(names) or 'no items with a vendor')
    if without_vendor:
        note += ' Without a vendor (manual purchase needed): ' + ', '.join(without_vendor)
    task.message_post(body=note)
