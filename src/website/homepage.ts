const SERVICES: Array<[title: string, text: string]> = [
  ['Smart home', 'Lighting, climate, blinds and security controlled from one app, with scenes.'],
  ['Electrical installation', 'Design and installation of wiring and switchboards for apartments, houses and commercial sites.'],
  ['Engineering systems', 'Heating, ventilation and underfloor heating integrated into one control system.'],
  ['Heat pumps', 'Selection, installation and tuning of energy-efficient heating.'],
  ['Residential complexes', 'Standard smart home packages for apartment blocks and cottage communities.'],
  ['Service', 'Support, maintenance and upgrades of systems already installed.'],
];

const STEPS = ['Request and consultation', 'Site visit and design', 'Quotation', 'Installation and setup', 'Handover and service'];

const card = ([title, text]: [string, string]): string =>
  `<div class="col-lg-4 col-md-6 mb-4"><div class="card h-100 p-4"><h3 class="h5">${title}</h3><p class="mb-0">${text}</p></div></div>`;

const step = (title: string, index: number): string =>
  `<div class="col mb-3"><div class="display-6 fw-bold text-primary">${index + 1}</div><p class="mb-0">${title}</p></div>`;

export function homepageArch(key: string): string {
  return `<t t-name="${key}"><t t-call="website.layout"><div id="wrap" class="oe_structure">
<section class="pt16 pb16"><div class="container"><div class="alert alert-warning mb-0 small">
Northwind Home Systems is a fictional company. This is a demo stand built by Opsline; all data is synthetic.
</div></div></section>
<section class="pt96 pb96"><div class="container"><div class="row align-items-center"><div class="col-lg-8">
<h1 class="display-4 fw-bold">Smart home, electrics and engineering systems, turnkey</h1>
<p class="lead mt-3">We design, install and maintain systems for apartments, houses, commercial sites and residential complexes.</p>
<a href="/zayavka" class="btn btn-primary btn-lg mt-3">Send a request</a>
<a href="/appointment" class="btn btn-outline-primary btn-lg mt-3 ms-2">Book a consultation</a>
</div></div></div></section>
<section class="pt64 pb32"><div class="container"><h2 class="mb-4">Services</h2><div class="row">${SERVICES.map(card).join('')}</div></div></section>
<section class="pt32 pb96"><div class="container"><h2 class="mb-4">How we work</h2><div class="row row-cols-2 row-cols-md-5 text-center">${STEPS.map(step).join('')}</div>
<p class="mt-4 text-muted">After your request, AI prepares a short brief for the manager, and an engineer contacts you to clarify the details.</p></div></section>
</div></t></t>`;
}
