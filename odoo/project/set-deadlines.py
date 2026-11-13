# Automation (project.task, on create): planned deadlines for tasks copied from the project template.
# Day offsets from project start are demo assumptions, to be replaced by the client's real norms.
DAY_OFFSETS = [2, 5, 12, 15, 25, 35, 40, 42, 45]

for task in records:
    if task.project_id.is_template or task.date_deadline:
        continue

    index = min(task.sequence or 0, len(DAY_OFFSETS) - 1)
    deadline_day = datetime.date.today() + datetime.timedelta(days=DAY_OFFSETS[index])
    task.write({'date_deadline': datetime.datetime.combine(deadline_day, datetime.time(16, 0))})
