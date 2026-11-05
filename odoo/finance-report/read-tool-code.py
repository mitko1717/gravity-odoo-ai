# Odoo server action (AI tool). Returns per-project figures computed by rules. Demo prices, synthetic expenses.
rows = []
for project in env['project.project'].search([('sale_order_id', '!=', False), ('is_template', '=', False)]):
    order = project.sale_order_id
    revenue = order.amount_untaxed
    purchases = sum(env['purchase.order'].search([('origin', '=', order.name), ('state', '!=', 'cancel')]).mapped('amount_untaxed'))
    by_category = {}
    for expense in env['x_gravity_expense'].search([('x_project_id', '=', project.id)]):
        by_category[expense.x_category] = by_category.get(expense.x_category, 0.0) + expense.x_amount
    expenses = sum(by_category.values())
    margin = revenue - purchases - expenses
    rows.append({
        'project': project.name,
        'revenue': revenue,
        'purchases': purchases,
        'expenses': expenses,
        'expenses_by_category': by_category,
        'margin': margin,
        'margin_pct': round(100.0 * margin / revenue, 1) if revenue else 0,
    })

ai['result'] = {
    'note': 'Figures are computed by rules from Odoo data (demo prices, synthetic expenses). Do not recalculate or invent numbers.',
    'currency': 'UAH, without VAT',
    'projects': rows,
}
