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
  { name: 'contact_name', label: 'Name', type: 'text', required: true },
  { name: 'email_from', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'tel', required: true },
  { name: 'x_object_type', label: 'Property type', type: 'select', options: optionsOf('x_object_type') },
  { name: 'x_city', label: 'City', type: 'text' },
  { name: 'x_area_m2', label: 'Area, m²', type: 'number' },
  { name: 'x_service', label: 'Service', type: 'select', options: optionsOf('x_service') },
  { name: 'x_budget_text', label: 'Approximate budget', type: 'text' },
  { name: 'description', label: 'Comment', type: 'textarea', required: true },
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
  const hiddenTitle = '<input type="hidden" class="s_website_form_input" name="name" value="Website request"/>';
  const submit = '<div class="col-12 s_website_form_submit" data-name="Submit Button"><a href="#" role="button" class="btn btn-primary btn-lg s_website_form_send">Send request</a><span id="s_website_form_result"></span></div>';

  return `
<section class="s_website_form pt48 pb48" data-vcss="001" data-snippet="s_website_form">
  <div class="container">
    <h1>Send a request</h1>
    <p class="lead">Tell us about your property and an engineer will contact you to clarify the details.</p>
    <form action="/website/form/" method="post" enctype="multipart/form-data" class="o_mark_required" data-mark="*"
          data-model_name="crm.lead" data-success-mode="redirect" data-success-page="/zayavka-dyakuyemo">
      <div class="s_website_form_rows row s_col_no_bgcolor">
        ${hiddenTitle}
        ${rows}
        ${submit}
      </div>
    </form>
    <p class="small text-muted mt-4">Northwind Home Systems is a fictional company; demo stand built by Opsline.
      Please do not enter real personal data.</p>
  </div>
</section>`;
}
