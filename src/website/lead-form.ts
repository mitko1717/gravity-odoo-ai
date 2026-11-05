import { FORM_FIELDS } from '../config/lead-fields.js';

interface InputSpec {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'number' | 'textarea' | 'select';
  required?: boolean;
  options?: Array<[string, string]>;
}

const escape = (value: string): string => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const optionsOf = (name: string): Array<[string, string]> => FORM_FIELDS.find((f) => f.name === name)?.options ?? [];

export const INPUTS: InputSpec[] = [
  { name: 'contact_name', label: 'Ім’я', type: 'text', required: true },
  { name: 'email_from', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Телефон', type: 'tel', required: true },
  { name: 'x_object_type', label: 'Тип об’єкта', type: 'select', options: optionsOf('x_object_type') },
  { name: 'x_city', label: 'Місто', type: 'text' },
  { name: 'x_area_m2', label: 'Площа, м²', type: 'number' },
  { name: 'x_service', label: 'Послуга', type: 'select', options: optionsOf('x_service') },
  { name: 'x_budget_text', label: 'Орієнтовний бюджет', type: 'text' },
  { name: 'description', label: 'Коментар', type: 'textarea', required: true },
];

function control(input: InputSpec, id: string): string {
  const required = input.required ? ' required="1"' : '';
  const base = `id="${id}" name="${input.name}"${required}`;

  if (input.type === 'textarea') return `<textarea ${base} class="form-control s_website_form_input" rows="5"></textarea>`;

  if (input.type === 'select') {
    const options = (input.options ?? []).map(([value, label]) => `<option value="${value}">${escape(label)}</option>`).join('');

    return `<select ${base} class="form-select s_website_form_input"><option value="">—</option>${options}</select>`;
  }

  return `<input ${base} type="${input.type}" class="form-control s_website_form_input"/>`;
}

function fieldRow(input: InputSpec, index: number): string {
  const id = `gravity_f${index}`;
  const requiredClass = input.required ? ' s_website_form_required' : '';
  const mark = input.required ? '<span class="s_website_form_mark"> *</span>' : '';
  const label = `<label class="s_website_form_label" for="${id}"><span class="s_website_form_label_content">${escape(input.label)}</span>${mark}</label>`;

  return `<div class="mb-3 col-12 col-lg-6 s_website_form_field${requiredClass}" data-type="char" data-name="Field">${label}${control(input, id)}</div>`;
}

export function leadFormSection(): string {
  const rows = INPUTS.map(fieldRow).join('\n');
  const hiddenTitle = '<input type="hidden" class="s_website_form_input" name="name" value="Заявка з сайту"/>';
  const submit = '<div class="col-12 s_website_form_submit" data-name="Submit Button"><a href="#" role="button" class="btn btn-primary btn-lg s_website_form_send">Надіслати заявку</a><span id="s_website_form_result"></span></div>';

  return `
<section class="s_website_form pt48 pb48" data-vcss="001" data-snippet="s_website_form">
  <div class="container">
    <h1>Залишити заявку</h1>
    <p class="lead">Розкажіть про ваш об’єкт — інженер зв’яжеться з вами та уточнить деталі.</p>
    <form action="/website/form/" method="post" enctype="multipart/form-data" class="o_mark_required" data-mark="*"
          data-model_name="crm.lead" data-success-mode="redirect" data-success-page="/contactus-thank-you">
      <div class="s_website_form_rows row s_col_no_bgcolor">
        ${hiddenTitle}
        ${rows}
        ${submit}
      </div>
    </form>
    <p class="small text-muted mt-4">Неофіційний демонстраційний стенд для тестового завдання. Не є сайтом компанії Gravity.
      Будь ласка, не вводьте реальні персональні дані.</p>
  </div>
</section>`;
}
