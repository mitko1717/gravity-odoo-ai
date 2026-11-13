const SERVICES: Array<[title: string, text: string]> = [
  ['Розумний дім', 'Керування світлом, кліматом, шторами та безпекою з одного застосунку і сценаріями.'],
  ['Електромонтаж', 'Проєктування та монтаж електрики й щитів для квартир, будинків і комерції.'],
  ['Інженерні системи', 'Опалення, вентиляція, тепла підлога — інтегровані в єдину систему керування.'],
  ['Теплові насоси', 'Підбір, встановлення та налаштування енергоефективного опалення.'],
  ['Житлові комплекси', 'Типові рішення розумного дому для ЖК і котеджних містечок.'],
  ['Сервіс', 'Підтримка, обслуговування та доопрацювання вже встановлених систем.'],
];

const STEPS = ['Заявка й консультація', 'Виїзд і проєкт', 'Комерційна пропозиція', 'Монтаж і налаштування', 'Здача й сервіс'];

const card = ([title, text]: [string, string]): string =>
  `<div class="col-lg-4 col-md-6 mb-4"><div class="card h-100 p-4"><h3 class="h5">${title}</h3><p class="mb-0">${text}</p></div></div>`;

const step = (title: string, index: number): string =>
  `<div class="col mb-3"><div class="display-6 fw-bold text-primary">${index + 1}</div><p class="mb-0">${title}</p></div>`;

export function homepageArch(key: string): string {
  return `<t t-name="${key}"><t t-call="website.layout"><div id="wrap" class="oe_structure">
<section class="pt16 pb16"><div class="container"><div class="alert alert-warning mb-0 small">
Неофіційний демонстраційний стенд для тестового завдання на позицію AI Builder. Не є сайтом компанії Opsline. Усі дані синтетичні.
</div></div></section>
<section class="pt96 pb96"><div class="container"><div class="row align-items-center"><div class="col-lg-8">
<h1 class="display-4 fw-bold">Розумний дім, електрика та інженерні системи під ключ</h1>
<p class="lead mt-3">Проєктуємо, монтуємо й обслуговуємо системи для квартир, будинків, комерції та житлових комплексів.</p>
<a href="/zayavka" class="btn btn-primary btn-lg mt-3">Залишити заявку</a>
<a href="/appointment" class="btn btn-outline-primary btn-lg mt-3 ms-2">Записатися на консультацію</a>
</div></div></div></section>
<section class="pt64 pb32"><div class="container"><h2 class="mb-4">Послуги</h2><div class="row">${SERVICES.map(card).join('')}</div></div></section>
<section class="pt32 pb96"><div class="container"><h2 class="mb-4">Як ми працюємо</h2><div class="row row-cols-2 row-cols-md-5 text-center">${STEPS.map(step).join('')}</div>
<p class="mt-4 text-muted">Після заявки AI готує для менеджера стислий опис запиту, а інженер зв’язується з вами для уточнення деталей.</p></div></section>
</div></t></t>`;
}
