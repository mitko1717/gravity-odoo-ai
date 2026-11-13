# Odoo server action (AI tool). Figures are rendered by rules; the AI provides only the commentary.
# str.format is forbidden in the Odoo sandbox, so use %-formatting.
now = datetime.datetime.now()
week_ago = now - datetime.timedelta(days=7)

leads = env['crm.lead'].with_context(active_test=False).search_count([('create_date', '>=', week_ago)])
high = env['crm.lead'].search_count([('create_date', '>=', week_ago), ('x_ai_priority', '=', 'high')])
orders = env['sale.order'].search([('state', '=', 'sale'), ('date_order', '>=', week_ago)])
overdue = env['project.task'].search_count([
    ('date_deadline', '<', now), ('parent_id', '=', False),
    ('project_id.is_template', '=', False), ('stage_id.name', '!=', 'Done'),
])
open_tickets = env['helpdesk.ticket'].search([('stage_id.fold', '=', False)])
critical = len(open_tickets.filtered(lambda ticket: ticket.priority == '3'))

figures = [
    'New leads: %d (AI high priority: %d)' % (leads, high),
    'Confirmed orders: %d for UAH %.0f excl. VAT' % (len(orders), sum(orders.mapped('amount_untaxed'))),
    'Overdue project tasks: %d' % overdue,
    'Open service tickets: %d (critical: %d)' % (len(open_tickets), critical),
]
attention = [line.strip() for line in (attention or '').split('\n') if line.strip()]

body = '<h2>Weekly owner report — %s</h2><p><i>Figures are computed by rules (demo data); the commentary is an AI draft.</i></p><h3>Figures of the week</h3><ul>%s</ul><h3>AI commentary</h3><p>%s</p><h3>Needs attention</h3><ul>%s</ul>' % (
    now.date().isoformat(),
    ''.join(['<li>%s</li>' % line for line in figures]),
    summary or '',
    ''.join(['<li>%s</li>' % line for line in attention]) or '<li>none</li>',
)
# Each week is a new child article: an archive of reports, and no clash with the editor of an article
# someone has open (the collaborative editor can overwrite a body written from the server).
report = env['knowledge.article'].create({
    'name': 'Weekly report — %s' % now.date().isoformat(),
    'parent_id': record.id,
    'body': body,
})

ai['result'] = 'weekly report saved as article %d' % report.id
