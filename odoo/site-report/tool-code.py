# Odoo server action (AI tool). Metrics and status are computed here by rules; the AI provides only the text.
today = datetime.date.today()
total = 0
done_count = 0
overdue = []
# Top-level tasks only: commissioning checks (sub-tasks) must not inflate progress.
for task in record.task_ids.filtered(lambda t: not t.parent_id):
    total += 1
    if task.state == '1_done' or task.stage_id.name == 'Done':
        done_count += 1
        continue
    deadline = task.date_deadline.date() if task.date_deadline else False
    if deadline and deadline < today:
        overdue.append((today - deadline).days)

progress = int(round(100.0 * done_count / total)) if total else 0
max_overdue = max(overdue) if overdue else 0
if total and done_count == total:
    status = 'done'
elif len(overdue) >= 2 or max_overdue > 7:
    status = 'off_track'
elif overdue:
    status = 'at_risk'
else:
    status = 'on_track'

metrics = 'Done %d of %d tasks (%d%%). Overdue: %d (max %d days).' % (done_count, total, progress, len(overdue), max_overdue)
description = '<p><b>%s</b></p><p>%s</p><p><b>Risks / blockers</b><br/>%s</p><p><b>Next steps</b><br/>%s</p><p><i>AI draft report; status and figures are computed by rules.</i></p>' % (
    metrics,
    summary or '',
    (blockers or 'none').replace('\n', '<br/>'),
    (next_steps or '').replace('\n', '<br/>'),
)
env['project.update'].create({
    'name': 'Site report %s' % today.isoformat(),
    'project_id': record.id,
    'status': status,
    'progress': progress,
    'description': description,
    'user_id': env.user.id,
})

ai['result'] = 'saved: %s, %d%%' % (status, progress)
