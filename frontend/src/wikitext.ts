/**
 * A file description as plain text. Imports store the {{Information}} description as wikitext
 * (services.imports.ImageText): language templates ({{uk|1=…}}), links ([[a|b]], [http://x y]),
 * bold / italic quotes, <br>, and HTML entities. The result is only ever set as text, never HTML.
 */

const LANG = /\{\{\s*([a-z]{2,3}(?:-[a-z]+)?)\s*\|\s*(?:1\s*=\s*)?([\s\S]*?)\}\}/gi

/** The text in the preferred language when the description has several, otherwise all of it. */
export function descriptionText(wikitext: string, lang = 'uk'): string {
  let text = wikitext
  const parts = [...text.matchAll(LANG)]
  if (parts.length > 1) {
    const pick = parts.find((p) => p[1].toLowerCase() === lang) ?? parts.find((p) => p[1].toLowerCase() === 'en') ?? parts[0]
    text = pick[2]
  } else {
    text = text.replace(LANG, '$2')
  }
  text = text
    .replace(/\{\{[^{}]*\}\}/g, '') // any other template
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1') // [[target|label]] → label
    .replace(/\[(?:https?:)?\/\/\S+\s+([^\]]+)\]/g, '$1') // [http://x label] → label
    .replace(/\[(?:https?:)?\/\/\S+\]/g, '') // a bare external link
    .replace(/'{2,}/g, '') // bold / italic
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<[^>]+>/g, '')
  // entities (&amp; &nbsp; &#39;) to characters, by the parser: text only
  const decoded = new DOMParser().parseFromString(`<p>${text.replace(/</g, '&lt;')}</p>`, 'text/html').body.textContent ?? ''
  return decoded.replace(/\s+/g, ' ').trim()
}
