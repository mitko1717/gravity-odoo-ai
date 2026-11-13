# Odoo server action (AI tool). Validates the AI draft against the catalog and saves it for the engineer.
# The draft is stored on the project (x_spec_lines) and shown in the design task; RFQs use it only after approval.
products = env['product.product'].search([('purchase_ok', '=', True), ('seller_ids', '!=', False), ('type', '=', 'consu')])
allowed = dict((product.id, product) for product in products)

stored = []
rows = []
rejected = 0
for line in lines or []:
    product = allowed.get(int(line.get('product_id') or 0))
    qty = int(line.get('qty') or 0)
    if not product or qty < 1 or qty > 200:
        rejected += 1
        continue
    stored.append('%d;%d' % (product.id, qty))
    rows.append('<tr><td>%s</td><td>%d</td><td>%s</td></tr>' % (product.display_name, qty, line.get('reason') or ''))

record.write({'x_spec_lines': '\n'.join(stored)})

table = '<table class="table table-sm"><tr><th>Item</th><th>Qty</th><th>Reason</th></tr>%s</table>' % ''.join(rows)
html = '<p><b>AI draft specification</b> (the engineer reviews and approves it; RFQs are created only when the approval task is «Done»).</p>%s<p><b>Assumptions</b><br/>%s</p><p><b>Clarify on site</b><br/>%s</p>' % (
    table,
    (assumptions or 'none').replace('\n', '<br/>'),
    (questions or 'none').replace('\n', '<br/>'),
)
if rejected:
    html += '<p><i>Rejected lines outside the catalog or with an invalid quantity: %d.</i></p>' % rejected

design_task = record.task_ids.filtered(lambda task: task.name == 'System design')[:1]
target = design_task or record
target.write({'description': html})
target.message_post(body='AI draft specification saved in the description: %d items. Engineer review required.' % len(stored))

ai['result'] = 'saved %d lines, rejected %d' % (len(stored), rejected)
