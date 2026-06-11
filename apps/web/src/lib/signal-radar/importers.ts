// ============================================================
// SignalRadar OS — paste-based importers (PURE, compliant, keyless)
// ------------------------------------------------------------
// Safe collection without scraping: the operator pastes content they
// already receive (Google Alerts digests, an RSS/Atom feed body, a CSV
// export) and we parse it into RawSignalInput[]. No network, no robots
// violations, no platform-ToS risk — just structured parsing of text
// the operator brought in. The collection engine then classifies/scores.
// ============================================================

import type { RawSignalInput, SignalSourceType } from './types';
import { extractUrls } from './normalize';

/**
 * Parse a pasted Google Alerts digest. Alerts arrive as blocks of
 * "Headline\n<url>\nsnippet". We split on blank lines and pull the first
 * URL + first line as title. Lenient by design — never throws.
 */
export function parseGoogleAlerts(text: string): RawSignalInput[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b.length > 0 && /https?:\/\//i.test(b));

  return blocks.map((block) => {
    const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
    const url = extractUrls(block)[0];
    const titleLine = lines.find((l) => !/^https?:\/\//i.test(l)) ?? lines[0];
    return {
      sourceType: 'google_alerts',
      collectionMethod: 'import_google_alerts',
      sourceName: 'Google Alerts',
      sourceUrl: url,
      title: titleLine,
      text: block,
    } satisfies RawSignalInput;
  });
}

/**
 * Parse a pasted RSS/Atom feed body. Light, defensive regex extraction of
 * <item>/<entry> title/link/description/pubDate. Good enough for operator
 * paste; never throws on malformed XML.
 */
export function parseRssFeed(xml: string): RawSignalInput[] {
  const items = xml.match(/<(item|entry)[\s>][\s\S]*?<\/\1>/gi) ?? [];
  return items.map((item) => {
    const title = decodeXml(pick(item, 'title'));
    const link = pickLink(item);
    const desc = decodeXml(pick(item, 'description') || pick(item, 'summary') || pick(item, 'content'));
    const pub = pick(item, 'pubDate') || pick(item, 'published') || pick(item, 'updated');
    return {
      sourceType: 'rss',
      collectionMethod: 'import_rss',
      sourceName: 'RSS feed',
      sourceUrl: link || undefined,
      title: title || undefined,
      text: [title, desc].filter(Boolean).join(' — ') || link || '',
      publishedAt: normalizeDate(pub),
    } satisfies RawSignalInput;
  }).filter((r) => r.text.length > 0);
}

/**
 * Parse a CSV export. Recognizes flexible header names (url/link,
 * title/headline, text/snippet/body, source, author, published/date).
 * Minimal quoted-field support. Never throws.
 */
export function parseCsv(csv: string): RawSignalInput[] {
  const rows = csvRows(csv);
  if (rows.length < 2) return [];
  const header = rows[0].map((h) => h.trim().toLowerCase());
  const idx = (names: string[]) => header.findIndex((h) => names.includes(h));
  const urlI = idx(['url', 'link', 'source_url']);
  const titleI = idx(['title', 'headline', 'subject']);
  const textI = idx(['text', 'snippet', 'body', 'content', 'mention', 'comment']);
  const srcI = idx(['source', 'source_name', 'site', 'domain']);
  const authI = idx(['author', 'name', 'username']);
  const dateI = idx(['published', 'date', 'published_at', 'created']);

  return rows.slice(1)
    .filter((r) => r.some((c) => c.trim().length))
    .map((r) => {
      const get = (i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
      const text = get(textI) || get(titleI);
      return {
        sourceType: 'csv' as SignalSourceType,
        collectionMethod: 'import_csv',
        sourceName: get(srcI) || 'CSV import',
        sourceUrl: get(urlI) || undefined,
        title: get(titleI) || undefined,
        text,
        authorName: get(authI) || undefined,
        publishedAt: normalizeDate(get(dateI)),
      } as RawSignalInput;
    })
    .filter((r) => r.text.length > 0);
}

// ── helpers ─────────────────────────────────────────────────
function pick(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  if (!m) return '';
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1').replace(/<[^>]+>/g, '').trim();
}

function pickLink(block: string): string {
  // RSS <link>url</link> OR Atom <link href="url" />
  const rss = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i);
  if (rss && rss[1].trim()) return rss[1].trim();
  const atom = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return atom?.[1]?.trim() ?? '';
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

/** Return ISO string when the input parses to a real date, else undefined. */
function normalizeDate(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const t = Date.parse(raw);
  return Number.isFinite(t) ? new Date(t).toISOString() : undefined;
}

/** Minimal CSV row splitter with double-quote support. */
function csvRows(csv: string): string[][] {
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let inQuotes = false;
  const text = csv.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows;
}
