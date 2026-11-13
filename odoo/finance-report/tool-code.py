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

table = '<table class="table table-bordered"><tr><th>Project</th><th>Revenue</th><th>Purchases</th><th>Expenses</th><th>Margin</th><th>Margin, %%</th></tr>%s</table>' % ''.join(table_rows)
body = '<h2>Management report by project (demo) — %s</h2><p><i>UAH excl. VAT. Demo prices, synthetic expenses. Figures are computed by rules; the commentary is an AI draft.</i></p>%s<h3>Findings</h3><p>%s</p><h3>Risks</h3><p>%s</p><h3>Recommendations</h3><p>%s</p>' % (
    datetime.date.today().isoformat(),
    table,
    summary or '',
    (risks or 'none').replace('\n', '<br/>'),
    (recommendations or '').replace('\n', '<br/>'),
)
record.write({'body': body})

ai['result'] = 'saved report for %d projects' % len(table_rows)
