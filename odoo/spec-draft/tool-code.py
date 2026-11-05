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
    rows.append('<tr><td>%s</td><td>%d</td><td>%s</td></tr>' % (product.display_name, qty, line.get('reason_uk') or ''))

record.write({'x_spec_lines': '\n'.join(stored)})

table = '<table class="table table-sm"><tr><th>Позиція</th><th>К-сть</th><th>Обґрунтування</th></tr>%s</table>' % ''.join(rows)
html = '<p><b>AI-чернетка специфікації</b> (інженер перевіряє й погоджує; RFQ створюються лише після статусу «Готово» задачі погодження).</p>%s<p><b>Припущення</b><br/>%s</p><p><b>Уточнити на об’єкті</b><br/>%s</p>' % (
    table,
    (assumptions_uk or 'немає').replace('\n', '<br/>'),
    (questions_uk or 'немає').replace('\n', '<br/>'),
)
if rejected:
    html += '<p><i>Відхилено рядків поза каталогом або з некоректною кількістю: %d.</i></p>' % rejected

design_task = record.task_ids.filtered(lambda task: task.name == 'Проєктування')[:1]
target = design_task or record
target.write({'description': html})
target.message_post(body='AI-чернетку специфікації збережено в описі: %d позицій. Потрібна перевірка інженера.' % len(stored))

ai['result'] = 'saved %d lines, rejected %d' % (len(stored), rejected)
