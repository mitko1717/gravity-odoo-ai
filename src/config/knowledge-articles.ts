// Synthetic internal regulations for the demo company Northwind Home Systems. Not real policies.
export interface ArticleSpec {
  name: string;
  body: string;
}

const DEMO_NOTE = '<p><i>Demo regulation with synthetic content. Not a binding company document.</i></p>';

export const KNOWLEDGE_ARTICLES: ArticleSpec[] = [
  {
    name: 'Service and SLA policy (demo)',
    body: DEMO_NOTE + [
      '<h2>Request priorities</h2>',
      '<ul><li>Critical (burning smell, sparking, no power at the property): response within 2 h, visit the same day.</li>',
      '<li>High (security down, no heating in winter): response within 8 h.</li>',
      '<li>Normal (a single scene, the app): response within 24 h.</li>',
      '<li>Low (wishes, new scenes): scheduled in the normal order.</li></ul>',
      '<h2>Engineer steps</h2>',
      '<ol><li>Confirm the request to the client.</li><li>Clarify symptoms, photos/videos.</li>',
      '<li>Try remote diagnostics.</li><li>If not solved, schedule a site visit.</li>',
      '<li>Close the ticket with a comment on the root cause.</li></ol>',
      '<p>If there is a risk to life (sparking, burning smell), advise the client to cut the power and call the emergency service.</p>',
    ].join(''),
  },
  {
    name: 'Warranty on works and equipment (demo)',
    body: DEMO_NOTE + [
      '<ul><li>Warranty on installation works: 24 months from the handover certificate date.</li>',
      '<li>Warranty on equipment: per manufacturer terms (usually 12–36 months).</li>',
      '<li>Not covered: third-party interference, voltage surges without a stabilizer, mechanical damage.</li>',
      '<li>Warranty visits are free; non-warranty visits are charged per the service price list.</li></ul>',
      '<p>A warranty case requires: contract number, handover certificate, problem description.</p>',
    ].join(''),
  },
  {
    name: 'Smart home installation checklist (demo)',
    body: DEMO_NOTE + [
      '<h2>Before the visit</h2>',
      '<ul><li>Approved specification and switchboard diagram.</li><li>Equipment checked at the warehouse.</li>',
      '<li>Site access and a responsible contact person.</li></ul>',
      '<h2>On site</h2>',
      '<ul><li>Photos of cable routes before walls are closed.</li><li>Every cable labelled at both ends.</li>',
      '<li>Insulation resistance measured, protocol filled in.</li><li>Photo of the assembled switchboard.</li></ul>',
      '<h2>After installation</h2>',
      '<ul><li>Upload photos and protocols to the project task.</li><li>Move the «Installation» task to «In review».</li></ul>',
    ].join(''),
  },
  {
    name: 'New employee onboarding (demo)',
    body: DEMO_NOTE + [
      '<ol><li>Day 1: Odoo access (CRM, Projects, Helpdesk), walkthrough of the end-to-end process map.</li>',
      '<li>Week 1: occupational and electrical safety briefing, site visit with a mentor.</li>',
      '<li>Month 1: own tasks under PM supervision, weekly feedback.</li></ol>',
      '<p>Rule for everyone: got a task → clarified the result and deadline → did it → checked it → handed it on.</p>',
      '<p>Access questions go to the administrator, task questions to your PM.</p>',
    ].join(''),
  },
];
