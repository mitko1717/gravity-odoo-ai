// Synthetic partners (designers, architects, developers). Not real companies or people.
export const CONTACT_INTERVAL_DAYS = 30;

export const PARTNER_TAGS = ['Partner: designer', 'Partner: architect', 'Partner: developer'];

export interface DemoPartner {
  name: string;
  tag: string;
  daysSinceContact: number;
}

export const DEMO_PARTNERS: DemoPartner[] = [
  { name: 'Interior studio "Demo Loft"', tag: 'Partner: designer', daysSinceContact: 5 },
  { name: 'Architecture bureau "Demo Arch"', tag: 'Partner: architect', daysSinceContact: 25 },
  { name: 'Designer Olena Demo', tag: 'Partner: designer', daysSinceContact: 40 },
  { name: 'Developer "Demo Build"', tag: 'Partner: developer', daysSinceContact: 90 },
];
