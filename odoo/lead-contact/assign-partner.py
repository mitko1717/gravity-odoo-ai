# Automation (crm.lead, on create): link the lead to a contact so quotation, project and bookings share one client.
# An existing contact with the same email is reused; otherwise Odoo creates one from the lead fields.
for lead in records:
    if lead.partner_id or not lead.email_from:
        continue

    existing = env['res.partner'].search([('email', '=ilike', lead.email_from)], limit=1)
    lead._handle_partner_assignment(force_partner_id=existing.id, create_missing=True)
    if existing:
        lead.message_post(body='Contact found by email: %s. The lead is linked to the existing client.' % existing.display_name)
    else:
        lead.message_post(body='Client contact created from the request data: %s.' % lead.partner_id.display_name)
