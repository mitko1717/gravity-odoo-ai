# Odoo server action (AI tool). The table is computed here by rules; the AI provides only the commentary.
# str.format is forbidden in the Odoo sandbox: use %-formatting, a literal percent is %%.
def money(value):
    return '%.0f' % value if value else '—'

table_rows = []
for campaign in env['utm.campaign'].search([('name', '=like', 'demo_%')]):
    leads = env['crm.lead'].with_context(active_test=False).search([('campaign_id', '=', campaign.id)])
    qualified = leads.filtered(lambda lead: lead.x_ai_priority in ('high', 'medium'))
    spend = campaign.x_ad_spend
    cpl = spend / len(leads) if leads else 0
    cpql = spend / len(qualified) if qualified else 0
    share = round(100.0 * len(qualified) / len(leads)) if leads else 0
    table_rows.append('<tr><td>%s</td><td>%s</td><td>%d</td><td>%d (%d%%)</td><td>%d</td><td>%s</td><td>%s</td></tr>' % (
        campaign.title, money(spend), len(leads), len(qualified), share, campaign.quotation_count, money(cpl), money(cpql)))

header = '<tr><th>Кампанія</th><th>Бюджет</th><th>Ліди</th><th>Кваліфіковані</th><th>Пропозиції</th><th>Ціна ліда</th><th>Ціна кваліф. ліда</th></tr>'
body = '<h2>Маркетинговий звіт по кампаніях (демо) — %s</h2><p><i>Грн. Демо-кампанії, синтетичні заявки. Кваліфікований = AI-пріоритет «високий» або «середній». Цифри — правила, коментар — AI-чернетка.</i></p><table class="table table-bordered">%s%s</table><h3>Висновки</h3><p>%s</p><h3>Попит</h3><p>%s</p><h3>Рекомендації</h3><p>%s</p>' % (
    datetime.date.today().isoformat(),
    header,
    ''.join(table_rows),
    summary_uk or '',
    demand_uk or '',
    (recommendations_uk or '').replace('\n', '<br/>'),
)
record.write({'body': body})

ai['result'] = 'saved report for %d campaigns' % len(table_rows)
