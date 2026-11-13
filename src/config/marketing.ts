// Synthetic campaigns, ad spend and leads for the marketing demo. Not real campaigns or people.
export interface CampaignSpec {
  key: string;
  title: string;
  source: string;
  medium: string;
  spend: number;
}

export const CAMPAIGNS: CampaignSpec[] = [
  { key: 'demo_google_smart_home', title: 'Google Ads: smart home Kyiv (demo)', source: 'Google', medium: 'cpc', spend: 24000 },
  { key: 'demo_facebook_lead_form', title: 'Facebook: lead form (demo)', source: 'Facebook', medium: 'social', spend: 18000 },
  { key: 'demo_partner_newsletter', title: 'Partner newsletter (demo)', source: 'Partners', medium: 'email', spend: 3000 },
];

export const MARKETING_ARTICLE = 'Marketing campaign report (demo)';

export const DEMO_LEADS: Array<[campaign: string, name: string, text: string]> = [
  ['demo_google_smart_home', 'Andrii Demo', 'House 220 m² in Bucha, I want lighting, climate and security, budget up to $18,000, start in December.'],
  ['demo_google_smart_home', 'Iryna Demo', 'Apartment 95 m² in Pechersk, lighting scenes and blinds, budget $6,000.'],
  ['demo_google_smart_home', 'Oleh Demo', 'How much does a smart home cost?'],
  ['demo_google_smart_home', 'Mariia Demo', 'Cottage 300 m², need turnkey electrics and a heat pump, budget ~$30,000.'],
  ['demo_google_smart_home', 'Viktor Demo', 'Office 150 m², access control and CCTV, we want it this quarter.'],
  ['demo_facebook_lead_form', 'Natalia Demo', 'Interested.'],
  ['demo_facebook_lead_form', 'Petro Demo', 'Call me.'],
  ['demo_facebook_lead_form', 'Svitlana Demo', 'I want a smart bulb, how much is it?'],
  ['demo_facebook_lead_form', 'Yurii Demo', 'Apartment 70 m², I want to control lights from my phone, budget unknown.'],
  ['demo_facebook_lead_form', 'Taras Demo', 'Just checking prices.'],
  ['demo_partner_newsletter', 'Bureau "Demo Arch"', 'We are designing a 120-apartment complex and need a smart home partner for all apartments, start in spring.'],
  ['demo_partner_newsletter', 'Studio "Demo Loft"', 'Client with a 260 m² house needs lighting, climate, multiroom audio, budget $25,000.'],
];
