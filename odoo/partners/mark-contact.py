# Manual action (res.partner): record that a contact with the partner happened today.
for partner in records:
    partner.write({'x_partner_last_contact': datetime.date.today()})
    partner.message_post(body='Partner contact made: %s.' % datetime.date.today().isoformat())
    reminders = partner.activity_ids.filtered(lambda activity: (activity.summary or '').startswith('Contact partner'))
    if reminders:
        reminders.action_feedback(feedback='Contact made')
