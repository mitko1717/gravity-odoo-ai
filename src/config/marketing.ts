// Synthetic campaigns, ad spend and leads for the marketing demo. Not real campaigns or people.
export interface CampaignSpec {
  key: string;
  title: string;
  source: string;
  medium: string;
  spend: number;
}

export const CAMPAIGNS: CampaignSpec[] = [
  { key: 'demo_google_smart_home', title: 'Google Ads: розумний дім Київ (демо)', source: 'Google', medium: 'cpc', spend: 24000 },
  { key: 'demo_facebook_lead_form', title: 'Facebook: лід-форма (демо)', source: 'Facebook', medium: 'social', spend: 18000 },
  { key: 'demo_partner_newsletter', title: 'Розсилка партнерам (демо)', source: 'Партнери', medium: 'email', spend: 3000 },
];

export const MARKETING_ARTICLE = 'Маркетинговий звіт по кампаніях (демо)';

export const DEMO_LEADS: Array<[campaign: string, name: string, text: string]> = [
  ['demo_google_smart_home', 'Андрій Демо', 'Будинок 220 м² у Бучі, хочу світло, клімат і безпеку, бюджет до 18 000 $, старт у грудні.'],
  ['demo_google_smart_home', 'Ірина Демо', 'Квартира 95 м² на Печерську, сценарії освітлення та штори, бюджет 6 000 $.'],
  ['demo_google_smart_home', 'Олег Демо', 'Скільки коштує розумний дім?'],
  ['demo_google_smart_home', 'Марія Демо', 'Котедж 300 м², потрібна електрика під ключ і тепловий насос, бюджет ~30 000 $.'],
  ['demo_google_smart_home', 'Віктор Демо', 'Офіс 150 м², контроль доступу і відеонагляд, хочемо цього кварталу.'],
  ['demo_facebook_lead_form', 'Наталя Демо', 'Цікавить.'],
  ['demo_facebook_lead_form', 'Петро Демо', 'Зателефонуйте мені.'],
  ['demo_facebook_lead_form', 'Світлана Демо', 'Хочу розумну лампочку, скільки коштує?'],
  ['demo_facebook_lead_form', 'Юрій Демо', 'Квартира 70 м², хочу керувати світлом з телефону, бюджет невідомий.'],
  ['demo_facebook_lead_form', 'Тарас Демо', 'Просто дивлюсь ціни.'],
  ['demo_partner_newsletter', 'Бюро «Демо-Арх»', 'Проєктуємо ЖК на 120 квартир, потрібен партнер з розумного дому для всіх квартир, старт навесні.'],
  ['demo_partner_newsletter', 'Студія «Демо-Лофт»', 'Клієнт з будинком 260 м², потрібні освітлення, клімат, мультирум, бюджет 25 000 $.'],
];
