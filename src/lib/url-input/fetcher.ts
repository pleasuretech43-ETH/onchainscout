/**
 * Fetches a URL and returns plain text.
 * Strips scripts, styles, and HTML tags. Caps length to keep responses manageable.
 */
export async function fetchUrlText(url: string, maxChars = 50_000): Promise<{ text: string; finalUrl: string; status: number }> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(`Invalid URL: ${url}`);
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error(`Unsupported protocol: ${parsed.protocol}`);
  }

  const r = await fetch(parsed.toString(), {
    headers: { 'user-agent': 'OnchainScout/0.1 (+hackathon)' },
    cache: 'no-store',
    redirect: 'follow',
  });
  if (!r.ok) throw new Error(`HTTP ${r.status} fetching ${url}`);

  const html = await r.text();
  const text = htmlToText(html).slice(0, maxChars);
  return { text, finalUrl: r.url, status: r.status };
}

export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
