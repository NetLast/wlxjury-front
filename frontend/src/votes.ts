/**
 * A vote, as tile-votes.js sends it: a POST to GalleryController.selectWS with the session's
 * CSRF token in Play's header. A failure is explained by the page's own vote-errors.js
 * (voteErrorMessage / voteErrorTexts, the texts in the page's language), signed out on to the
 * login page.
 */

declare global {
  interface Window {
    voteErrorMessage?: (status: number, body: unknown, texts: Record<string, string>) => string
    voteErrorTexts?: (el: Element | null) => Record<string, string>
  }
}

export const voteUrl = (roundId: string, pageId: string, rate: number) =>
  `/rate/round/${encodeURIComponent(roundId)}/pageid/${encodeURIComponent(pageId)}/select/${rate}`

export async function sendVote(roundId: string, pageId: string, rate: number): Promise<void> {
  const holder = document.querySelector('[data-csrf-token]')
  const res = await fetch(voteUrl(roundId, pageId, rate), {
    method: 'POST',
    headers: { 'Csrf-Token': holder?.getAttribute('data-csrf-token') ?? '' },
    credentials: 'same-origin'
  })
  if (res.ok) return
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    /* not JSON */
  }
  explain(res.status, body, holder)
  throw new Error(`vote failed: ${res.status}`)
}

function explain(status: number, body: unknown, holder: Element | null) {
  if (!window.voteErrorMessage || !window.voteErrorTexts) return
  const texts = window.voteErrorTexts(holder)
  window.alert(window.voteErrorMessage(status, body, texts))
  if (status === 401 && texts.loginUrl) window.location.href = texts.loginUrl
}
