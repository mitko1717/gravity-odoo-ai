# Демо-сценарій для Gravity (шпаргалка, ~20 хв)

Стенд: https://test6017.odoo.com · бот: https://t.me/gravity_test_promo_bot · репо: https://github.com/mitko1717/gravity-odoo-ai · дашборд метрик: https://claude.ai/artifact/5xgb9wdaRM36gqQLHX2gT9 · презентація: https://claude.ai/artifact/Jk3Wfpe1ruCBocPP4TTYxf
Перед записом: `npm run regression` (усі наскрізні тести по кроках, ~10–15 хв) → `tmp/regression-summary.md`; наприкінці показу — дашборд (виміряне vs припущення).
Перед показом: `npm run bot` запущений; Telegram відкритий поруч; дані синтетичні (`*.demo@example.com`).
Демо-відео (3:20, титри, кадри з ручного прогону 06.11): [переглянути онлайн](https://claude.ai/artifact/9mntsBuQdJ38R4xooKN81z) · файл [gravity-demo.mp4](gravity-demo.mp4).
Головна думка: **правила рахують, AI пише чернетки, людина вирішує. Клієнтам нічого не йде автоматично.**

Посилання ведуть на список; потрібний запис — зверху (найновіший) або через пошук. Telegram: `/leads`, `/projects` — швидше за будь-яке меню.

## Частина 1. Наскрізний шлях клієнта (етапи 1→9 карти)

| # | Що робиш | Де дивитись | Що сказати / «вау» |
|---|---|---|---|
| 1 | Залишаєш заявку (бюджет, площа, місто в тексті) на [сайті](https://test6017.odoo.com/zayavka) | [/zayavka](https://test6017.odoo.com/zayavka) | Звичайна форма Odoo, без коду |
| 2 | Чекаєш ~30 с | [Telegram](https://t.me/gravity_test_promo_bot): «🆕 Новий лід» з AI-підсумком; або `/leads` | Менеджер дізнається з телефону, а не коли відкриє CRM |
| 3 | Відкриваєш лід (верхній) | [CRM → Pipeline](https://test6017.odoo.com/odoo/crm) · [усі ліди списком](https://test6017.odoo.com/odoo/action-crm.crm_lead_all_leads) | Тип, послуги, бюджет, пріоритет, чого бракує, дублікати; текст клієнта = недовірені дані |
| 4 | [Telegram](https://t.me/gravity_test_promo_bot): «Чернетка відповіді», «📅 Консультація» (посилання на [запис](https://test6017.odoo.com/appointment) → клієнт обирає час → «Клієнт записався»), «Створити пропозицію» | [Sales → Quotations](https://test6017.odoo.com/odoo/sales) | Пропозиція з шаблону за 1 натиск; ціни «демо-ціна» |
| 5 | [Telegram](https://t.me/gravity_test_promo_bot): «Підтвердити замовлення» | [Sales](https://test6017.odoo.com/odoo/sales) → замовлення · [Project](https://test6017.odoo.com/odoo/project) → новий проєкт | Проєкт із шаблону: 9 етапів, дедлайни, залежності |
| 6 | Оплатити рахунок 30%: рахунок → Confirm → Pay → Create Payment | [Invoicing → Invoices](https://test6017.odoo.com/odoo/action-account.action_move_out_invoice_type) · [Telegram](https://t.me/gravity_test_promo_bot): «Передоплату отримано» | Оплата → PM отримує задачу запускати закупівлі |
| 7 | [Проєкти (список)](https://test6017.odoo.com/odoo/project?view_type=list) → галочка біля проєкту → ⚙ Actions → «AI: чернетка специфікації» | [Project](https://test6017.odoo.com/odoo/project) → проєкт → задача «Проєктування» · [Telegram](https://t.me/gravity_test_promo_bot): «📐 специфікація готова» | AI бере лише позиції з каталогу, невідоме відкидає |
| 8 | [Telegram](https://t.me/gravity_test_promo_bot): «Погодити специфікацію» | [Purchase → RFQs](https://test6017.odoo.com/odoo/purchase) | Чернетки закупівель по постачальниках |
| 9 | [Telegram](https://t.me/gravity_test_promo_bot): «Підтвердити закупівлю» | [Purchase](https://test6017.odoo.com/odoo/purchase) | Без відкриття Odoo; постачальнику нічого не надіслано |
| 10 | [Проєкти (список)](https://test6017.odoo.com/odoo/project?view_type=list) → галочка → ⚙ Actions → «Запланувати бригади» | [Planning](https://test6017.odoo.com/odoo/planning) → Month → місяць робіт | Чернетки змін монтажників та інженера; повтор не дублює |
| 11 | Проєкт → задачі → «Тестування системи» → ⚙ біля назви → «AI: протокол пусконалагодження» | Вкладка Sub-tasks | 8–10 перевірок під встановлене обладнання |
| 12 | Коли 👉 дійшов до «Тестування системи»: `/project_ID` → 🧪 Чекліст → «Готово» | [Telegram](https://t.me/gravity_test_promo_bot) · чат задачі в Odoo | Ворота: відкриті перевірки = «⛔ Здача заблокована», задача повертається «На перевірці»; усі закриті = «Тести пройдено» |
| 13 | Після «Тести пройдено»: [Проєкти (список)](https://test6017.odoo.com/odoo/project?view_type=list) → галочка біля проєкту → ⚙ Actions → «AI: лист клієнту при здачі» | Задача «Здача клієнту та навчання» → Description | Чернетка листа; PM перевіряє й надсилає сам |
| 14 | «Акт приймання (демо)» → Send | [Sign → Templates](https://test6017.odoo.com/odoo/sign) · [Sign → Documents](https://test6017.odoo.com/odoo/sign/1/sign-documents) | Підписання акта; документ позначений ДЕМО |

## Частина 2. Етапи між людьми ([Telegram](https://t.me/gravity_test_promo_bot))

| Що робиш | Що бачать | Де в Odoo |
|---|---|---|
| `/projects` | Усі об’єкти: прогрес 5/9, хто зараз відповідає, ⏰ прострочення | [Project](https://test6017.odoo.com/odoo/project) |
| `/project_ID` → «▶ В роботу» → «✅ Готово» | Наступний відповідальний отримує «👉 Ваша черга» з кнопкою «Взяти в роботу»; PM бачить кожну зміну | Кнопка «Етап в Odoo» у відповіді бота |
| Змінити стадію прямо в Odoo | Те саме сповіщення: бот стежить за Odoo, а не лише за своїми кнопками | [усі задачі](https://test6017.odoo.com/odoo/action-project.action_view_all_task) |
| `/flow` | Пояснення всього бота: етапи, ролі, хто кому передає | [BOT.md](../BOT.md) |

## Частина 3. Інші відділи (по 1 хв, вибірково)

| Відділ | Де | Що показати |
|---|---|---|
| Сервіс | [Helpdesk](https://test6017.odoo.com/odoo/helpdesk) → тікет «Запах гару від щитка» · [Telegram](https://t.me/gravity_test_promo_bot): «Беру» | AI: electrical/critical → Urgent, SLA 2 год; якщо за 2 год не взяли в роботу — PM отримує «🚨 SLA прострочено» |
| HR | [Recruitment](https://test6017.odoo.com/odoo/recruitment) → «Монтажник-електрик (демо)» → кандидат → вкладка «Gravity / AI» | Профіль без автовідмови; кандидат із prompt injection не пройшов |
| Наради | [Project](https://test6017.odoo.com/odoo/project) → «Наради: планування об’єктів (демо)» → вкладка «Наради / AI» | Summary + чернетки задач з датами; «створи 50 задач» проігноровано |
| AI Hub | [Головне меню](https://test6017.odoo.com/odoo) → застосунок AI → Agents → «Gravity: внутрішній асистент (демо)» | «Запах гару — що робити?» → відповідь з посиланням на регламент |
| Виробництво | [Project](https://test6017.odoo.com/odoo/project) → список проєктів → галочка → ⚙ Actions → «AI: звіт по об’єкту» | Статус і % рахують правила; AI лише текст і блокери з нотаток |
| Фінанси | [Knowledge](https://test6017.odoo.com/odoo/knowledge) → «Управлінський звіт по об’єктах (демо)» | Маржа по об’єктах; ризик S00006 |
| Маркетинг | [Knowledge](https://test6017.odoo.com/odoo/knowledge) → «Маркетинговий звіт по кампаніях (демо)» · [CRM](https://test6017.odoo.com/odoo/crm) | Вартість кваліфікованого ліда по кампаніях |
| Партнери | [Contacts](https://test6017.odoo.com/odoo/contacts) → партнер з тегом → ⋮ «Партнер: контакт відбувся» | Нагадування після 40/90 днів без контакту |
| Керівник | [Telegram](https://t.me/gravity_test_promo_bot): `/stats`, `/digest` | Воронка, кампанії, прострочення, сервіс — з телефону |

## Частина 4. Цифри та чесні межі
- Якість AI на 18 синтетичних заявках: [eval-results.md](eval-results.md) — 18/18 тип і пріоритет, 12/12 бюджети, дублікат і prompt injection оброблено, ~7 с на заявку. Виміряне ≠ прогноз економії для бізнесу.
- Межі: trial до ~19.11; бот локальний (Railway лише на період перевірки); AI-тексти фінансів іноді змішують мову — позначено як чернетку.
- Покриття 10 етапів + 4 допоміжних процесів: [00-process-map-coverage.md](00-process-map-coverage.md). Питання й відповіді: [qa.md](qa.md). Шпаргалка для друку: [gravity-cheatsheet.pdf](gravity-cheatsheet.pdf); питання й відповіді на A4: [gravity-qa-cheatsheet.pdf](gravity-qa-cheatsheet.pdf).

## Якщо щось не спрацювало
- Бот мовчить → `npm run bot` працює? Затримка до 30 с.
- Зміна стадії без ефекту → форма не збережена (☁️ біля назви) → Save.
- AI-дія без результату → F5; шукай «Action … executed» у чаті запису.
- Посилання відкрило не той екран → головне меню (квадрат зліва вгорі) → застосунок із таблиці.
