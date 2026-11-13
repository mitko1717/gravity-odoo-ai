# Odoo server action (AI tool). Returns per-campaign metrics computed by rules. Demo campaigns and synthetic leads.
SERVICE_LABELS = {'lighting': 'lighting', 'climate': 'climate', 'security': 'security', 'smart_home': 'smart home', 'electrical': 'electrical', 'heat_pump': 'heat pump', 'multiroom': 'multiroom audio', 'other': 'other'}

rows = []
for campaign in env['utm.campaign'].search([('name', '=like', 'demo_%')]):
    leads = env['crm.lead'].with_context(active_test=False).search([('campaign_id', '=', campaign.id)])
    qualified = leads.filtered(lambda lead: lead.x_ai_priority in ('high', 'medium'))
    services = {}
    for lead in leads:
        for service in (lead.x_ai_services or '').split(','):
            service = SERVICE_LABELS.get(service.strip(), service.strip())
            if service:
                services[service] = services.get(service, 0) + 1
    spend = campaign.x_ad_spend
    rows.append({
        'campaign': campaign.title,
        'spend_uah': spend,
        'leads': len(leads),
        'qualified_leads': len(qualified),
        'quotations': campaign.quotation_count,
        'cost_per_lead': round(spend / len(leads)) if leads else None,
        'cost_per_qualified_lead': round(spend / len(qualified)) if qualified else None,
        'requested_services': services,
    })

ai['result'] = {
    'note': 'Metrics are computed by rules (qualified = AI lead priority high or medium). Demo data. Do not recalculate or invent numbers.',
    'campaigns': rows,
}
