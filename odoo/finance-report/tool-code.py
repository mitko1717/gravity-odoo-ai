# Odoo server action (AI tool). The table is computed here by rules; the AI provides only the commentary.
# str.format is forbidden in the Odoo sandbox, so use %-formatting.
def money(value):
    return '%.0f' % value

table_rows = []
for project in env['project.project'].search([('sale_order_id', '!=', False), ('is_template', '=', False)]):
    order = project.sale_order_id
    revenue = order.amount_untaxed
    purchases = sum(env['purchase.order'].search([('origin', '=', order.name), ('state', '!=', 'cancel')]).mapped('amount_untaxed'))
    expenses = sum(env['x_gravity_expense'].search([('x_project_id', '=', project.id)]).mapped('x_amount'))
    margin = revenue - purchases - expenses
    margin_pct = round(100.0 * margin / revenue, 1) if revenue else 0
    table_rows.append('<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s%%</td></tr>' % (
        project.name, money(revenue), money(purchases), money(expenses), money(margin), margin_pct))

table = '<table class="table table-bordered"><tr><th>Проєкт</th><th>Виручка</th><th>Закупівлі</th><th>Витрати</th><th>Маржа</th><th>Маржа, %%</th></tr>%s</table>' % ''.join(table_rows)
body = '<h2>Управлінський звіт по об’єктах (демо) — %s</h2><p><i>Грн без ПДВ. Демо-ціни, синтетичні витрати. Цифри розраховано правилами, коментар — AI-чернетка.</i></p>%s<h3>Висновки</h3><p>%s</p><h3>Ризики</h3><p>%s</p><h3>Рекомендації</h3><p>%s</p>' % (
    datetime.date.today().isoformat(),
    table,
    summary_uk or '',
    (risks_uk or 'немає').replace('\n', '<br/>'),
    (recommendations_uk or '').replace('\n', '<br/>'),
)
record.write({'body': body})

ai['result'] = 'saved report for %d projects' % len(table_rows)
