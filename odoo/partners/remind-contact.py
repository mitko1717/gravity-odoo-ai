# Automation (res.partner, N days after «last contact»): remind the responsible salesperson.
for partner in records:
    open_reminders = env['mail.activity'].search_count([
        ('res_model', '=', 'res.partner'),
        ('res_id', '=', partner.id),
        ('summary', '=like', 'Зв’язатися з партнером%'),
    ])
    if open_reminders:
        continue

    manager = partner.user_id or env.ref('base.user_admin')
    partner.activity_schedule(
        'mail.mail_activity_data_call',
        summary='Зв’язатися з партнером: %s' % partner.name,
        note='Понад 30 днів без контакту. Після дзвінка/зустрічі натисніть дію «Партнер: контакт відбувся».',
        user_id=manager.id,
    )
