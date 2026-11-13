# Automation (res.partner, N days after «last contact»): remind the responsible salesperson.
for partner in records:
    open_reminders = env['mail.activity'].search_count([
        ('res_model', '=', 'res.partner'),
        ('res_id', '=', partner.id),
        ('summary', '=like', 'Contact partner%'),
    ])
    if open_reminders:
        continue

    manager = partner.user_id or env.ref('base.user_admin')
    partner.activity_schedule(
        'mail.mail_activity_data_call',
        summary='Contact partner: %s' % partner.name,
        note='More than 30 days without contact. After the call or meeting run the action «Partner: contact made».',
        user_id=manager.id,
    )
