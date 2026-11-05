# Manual action (res.partner): record that a contact with the partner happened today.
for partner in records:
    partner.write({'x_partner_last_contact': datetime.date.today()})
    partner.message_post(body='Контакт з партнером відбувся: %s.' % datetime.date.today().isoformat())
    reminders = partner.activity_ids.filtered(lambda activity: (activity.summary or '').startswith('Зв’язатися з партнером'))
    if reminders:
        reminders.action_feedback(feedback='Контакт відбувся')
