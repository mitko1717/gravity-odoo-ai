# Automation (calendar.event, on create, appointment bookings only): attach the booking to the client's lead.
# Match: the booker's contact (same email) on an open lead; the newest lead wins.
CONSULT_STAGE = 'Consultation / site visit'
ACTIVITY_SUMMARY = 'Check the consultation booking'

for event in records:
    booker = event.appointment_booker_id
    if event.opportunity_id or not booker:
        continue

    lead_domain = [('partner_id', '=', booker.id)]
    if booker.email:
        lead_domain = ['|', ('partner_id', '=', booker.id), ('email_from', '=ilike', booker.email)]
    lead = env['crm.lead'].search(lead_domain, order='create_date desc', limit=1)
    if not lead:
        continue

    event.write({'opportunity_id': lead.id})

    stage = env['crm.stage'].search([('name', '=', CONSULT_STAGE)], limit=1)
    if stage and lead.stage_id.sequence < stage.sequence:
        lead.write({'stage_id': stage.id})

    # The booking runs as the public website user: activities are read with sudo to see the manager's To-Do.
    pending = env['mail.activity'].sudo().search([('res_model', '=', 'crm.lead'), ('res_id', '=', lead.id), ('summary', '=', ACTIVITY_SUMMARY)])
    if pending:
        pending.action_feedback(feedback='The client booked via the booking page.')

    lead.message_post(body='📅 The client booked a consultation: %s. The meeting is linked to the lead.' % event.display_name)
