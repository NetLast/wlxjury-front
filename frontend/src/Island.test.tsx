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

  it('opens the large view by the tile link, with the description on the card', async () => {
    const island = await start()
    const link = within(island).getByRole('link', { name: 'A b.jpg' })
    expect(link).toHaveAttribute('href', '/large/round/7/user/2/pageid/11')
    // a juror: the monument, never an author or a description
    expect(within(island).getByText('Monument: 46-101-0001')).toBeInTheDocument()
    expect(within(island).queryByText(/Author/)).not.toBeInTheDocument()
    expect(within(island).getByLabelText('two: open the comments')).toBeInTheDocument()
  })

  it('shows an organizer the description as text and the author', async () => {
    const island = await start({ jury: false, org: true })
    expect(within(island).getByText('Old church')).toBeInTheDocument()
    expect(within(island).getByText('Author: Ann · Monument: 46-101-0001')).toBeInTheDocument()
    // no votes for a viewer who doesn't vote
    expect(within(island).queryByRole('button', { name: 'Selected' })).not.toBeInTheDocument()
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
