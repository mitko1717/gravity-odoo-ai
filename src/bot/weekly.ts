import { InlineKeyboard } from 'grammy';
import type { OdooClient } from '../odoo-client.js';
import { WEEKLY_ARTICLE } from '../config/weekly.js';
import { escapeHtml, recordUrl } from './format.js';

// The report is written into a Knowledge article by an Odoo AI action (weekly scheduled action, Monday 08:00 Kyiv).
// The bot only delivers it: figures come from rules, the commentary is an AI draft.
const MONDAY = 1;
const FRESH_HOURS = 30;

interface ArticleRow {
  id: number;
  body: string | false;
  write_date: string;
}

const htmlToText = (html: string): string =>
  html
    .replace(/<h[12][^>]*>.*?<\/h[12]>/gs, '')
    .replace(/<li>/g, '• ')
    .replace(/<h3>(.*?)<\/h3>/g, '\n<b>$1</b>\n')
    .replace(/<\/(p|li|ul)>/g, '\n')
    .replace(/<(?!\/?b>)[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export interface WeeklyMessage {
  text: string;
  keyboard: InlineKeyboard;
}

export async function buildWeekly(odoo: OdooClient, odooUrl: string): Promise<WeeklyMessage | undefined> {
  const [parent] = await odoo.search('knowledge.article', [['name', '=', WEEKLY_ARTICLE]]);
  if (parent === undefined) return undefined;

  // The newest child article is the latest report; the parent keeps the archive.
  const [latest] = await odoo.call<ArticleRow[]>('knowledge.article', 'search_read', {
    domain: [['parent_id', '=', parent]],
    fields: ['body', 'write_date'],
    order: 'id desc',
    limit: 1,
  });
  const article: ArticleRow = latest ?? { id: parent, body: false, write_date: new Date(0).toISOString().slice(0, 19).replace('T', ' ') };

  const ageHours = (Date.now() - Date.parse(`${article.write_date.replace(' ', 'T')}Z`)) / 3600000;
  const staleNote = ageHours > FRESH_HOURS && String(article.body || '').includes('Цифри тижня') ? '\n\n<i>Звіт ще не оновлено цього тижня: Settings → Technical → Scheduled Actions → «Opsline: тижневий звіт керівнику» → Run Manually.</i>' : '';
  const rawBody = String(article.body || '');
  const hasReport = rawBody.includes('Цифри тижня');
  const body = hasReport ? htmlToText(rawBody) : '';
  const keyboard = new InlineKeyboard().url('Звіт в Odoo', recordUrl(odooUrl, 'knowledge.article', article.id));

  // Bold tags are kept for headings; everything else from the article is escaped text.
  const safeBody = escapeHtml(body).replace(/&lt;(\/?)b&gt;/g, '<$1b>');

  return { text: `📈 <b>Тижневий звіт керівнику</b>\n\n${safeBody || 'Звіт ще не згенеровано: Settings → Technical → Scheduled Actions → «Opsline: тижневий звіт керівнику» → Run Manually.'}${staleNote}`, keyboard };
}

/** Monday after the digest hour, once per week. */
export const isWeeklyDue = (now: Date, digestHour: number, lastWeeklyDate: string): boolean => {
  const today = now.toISOString().slice(0, 10);

  return now.getDay() === MONDAY && now.getHours() >= digestHour && lastWeeklyDate !== today;
};
