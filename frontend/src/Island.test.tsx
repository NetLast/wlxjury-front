import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { page } from './fixture'
import { classicRequested, mount } from './main'

class RO { observe() {} disconnect() {} unobserve() {} }
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1200 })

const fetchMock = vi.fn()
beforeEach(() => {
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO
  fetchMock.mockReset()
  globalThis.fetch = fetchMock as unknown as typeof fetch
  window.voteErrorTexts = (el) => ({ failed: el?.getAttribute('data-vote-failed') ?? '', loginUrl: '/auth' })
  window.voteErrorMessage = (status) => `error ${status}`
  window.alert = vi.fn()
})

async function start(opts?: Parameters<typeof page>[0]) {
  page(opts)
  await act(async () => { mount(document) })
  return document.querySelector('.wlx-island') as HTMLElement
}

describe('the gallery island', () => {
  it('keeps the old tiles on ?tiles=classic', () => {
    expect(classicRequested('?tiles=classic')).toBe(true)
    expect(classicRequested('?page=2')).toBe(false)
  })

  it('keeps the card clean: no description on the tile', async () => {
    const island = await start({ jury: false, org: true })
    expect(within(island).queryByText('Old church')).not.toBeInTheDocument()
    expect(within(island).queryByText(/Monument:/)).not.toBeInTheDocument()
    expect(within(island).getByLabelText('two: open the comments')).toBeInTheDocument()
  })

  it('enlarges the photo on a click, with the juror\'s info, votes and links', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    const island = await start()
    const link = within(island).getByRole('link', { name: 'A b.jpg' })
    // a new tab still gets the large view page
    expect(link).toHaveAttribute('href', '/large/round/7/user/2/pageid/11')
    fireEvent.click(link)
    const viewer = await screen.findByRole('dialog')
    // a juror: the monument and the size, never an author or a description
    expect(within(viewer).getAllByText('Monument: 46-101-0001 · 1500 × 1000').length).toBeGreaterThan(0)
    expect(within(viewer).queryByText(/Author/)).not.toBeInTheDocument()
    // (the lightbox also renders the neighbouring slide: look for this file's links among them)
    const hrefs = (name: RegExp) => within(viewer).getAllByRole('link', { name }).map((a) => a.getAttribute('href'))
    expect(hrefs(/File details/)).toContain('/large/round/7/user/2/pageid/11')
    expect(hrefs(/Open on Commons/)).toContain('https://commons.wikimedia.org/wiki/File:A_b.jpg')
    expect(within(viewer).getAllByRole('button', { name: 'Close' }).length).toBeGreaterThan(0)
    // the votes in the enlarged view
    const panel = within(viewer).getAllByText('A b.jpg').map((el) => el.closest('.wlx-island-panel') as HTMLElement)[0]
    fireEvent.click(within(panel).getByRole('button', { name: 'Selected' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/rate/round/7/pageid/11/select/1', expect.anything()))
  })

  it('shows an organizer the description as text and the author in the enlarged photo', async () => {
    const island = await start({ jury: false, org: true })
    fireEvent.click(within(island).getByRole('link', { name: 'A b.jpg' }))
    const viewer = await screen.findByRole('dialog')
    expect(within(viewer).getAllByText('Old church').length).toBeGreaterThan(0)
    expect(within(viewer).getAllByText('Author: Ann · Monument: 46-101-0001 · 1500 × 1000').length).toBeGreaterThan(0)
    expect(within(viewer).queryByRole('button', { name: 'Selected' })).not.toBeInTheDocument()
  })

  it('a click with Ctrl (a new tab) goes to the large view page, not the enlarged photo', async () => {
    const island = await start()
    fireEvent.click(within(island).getByRole('link', { name: 'A b.jpg' }), { ctrlKey: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('votes in a binary round with the CSRF token, and a second click clears the vote', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    const island = await start()
    const select = within(island).getAllByRole('button', { name: 'Selected' })[0]
    fireEvent.click(select)
    await waitFor(() => expect(select).toHaveAttribute('aria-pressed', 'true'))
    expect(fetchMock).toHaveBeenCalledWith('/rate/round/7/pageid/11/select/1',
      expect.objectContaining({ method: 'POST', headers: { 'Csrf-Token': 'tok' } }))
    await waitFor(() => expect(select).not.toBeDisabled())
    fireEvent.click(select)
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/rate/round/7/pageid/11/select/0', expect.anything()))
    // the second file is already rejected: its ✗ is pressed
    expect(within(island).getAllByRole('button', { name: 'Rejected' })[1]).toHaveAttribute('aria-pressed', 'true')
  })

  it('puts the vote back and explains it when the server refuses', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 409, json: async () => ({ error: 'round_closed' }) })
    const island = await start()
    const select = within(island).getAllByRole('button', { name: 'Selected' })[0]
    fireEvent.click(select)
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('error 409'))
    await waitFor(() => expect(select).toHaveAttribute('aria-pressed', 'false'))
  })

  it('rates in half stars (two units a star) with the worst mark', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200 })
    const island = await start({ binary: false, stars: '{"number":5,"half":true,"worst":true}' })
    fireEvent.click(within(island).getAllByRole('button', { name: '3.5' })[0])
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/rate/round/7/pageid/11/select/7', expect.anything()))
    expect(await within(island).findByText('3.5★')).toBeInTheDocument()
    fireEvent.click(within(island).getAllByRole('button', { name: 'Worst mark' })[0])
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith('/rate/round/7/pageid/11/select/-1', expect.anything()))
    expect(screen.getAllByRole('button', { name: 'Clear the vote' }).length).toBeGreaterThan(0)
  })

  it('shows a grey tile with an icon for a thumbnail that fails to load', async () => {
    const island = await start()
    const img = island.querySelector('img') as HTMLImageElement
    fireEvent.error(img)
    expect(await within(island).findByRole('img', { name: 'File:A b.jpg' })).toHaveClass('wlx-island-failed')
  })
})
