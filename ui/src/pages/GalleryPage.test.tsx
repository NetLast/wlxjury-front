import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GalleryPage, { groupByRegion, queueFor } from './GalleryPage'
import { scaleOf } from '../auth/scale'
import { mockImagesByRound } from '../mock/mockData'
import { store } from '../store/store'
import { signedIn } from '../store/authSlice'
import { api } from '../api/api'

class IO { observe() {} disconnect() {} unobserve() {} }
// jsdom has no layout: give the photo album a container width to lay the rows out in
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1200 })

function setup(roles: string[], id: string, round: string) {
  ;(globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver = IO
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = IO
  store.dispatch(api.util.resetApiState())
  store.dispatch(signedIn({ token: 't', user: { id, fullname: 'U', email: 'u@x', roles } }))
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/rounds/${round}`]}>
        <Routes><Route path="/rounds/:roundId" element={<GalleryPage />} /></Routes>
      </MemoryRouter>
    </Provider>
  )
}

beforeEach(() => {
  // the mock backend keeps votes in memory: start every test from a clean round
  Object.values(mockImagesByRound).forEach((l) => l.forEach((x) => { x.selections = []; x.rateSum = 0 }))
})

describe('queueFor', () => {
  it('reads the rates best first, so the list comes sorted from the server', () => {
    expect(queueFor('all', 'rating', scaleOf(3, true), false)).toEqual([3, 2, 1, 0, -1])
    expect(queueFor('all', 'rating', scaleOf(3, false), false)).toEqual([3, 2, 1, 0])
    expect(queueFor('accepted', 'default', scaleOf(1), false)).toEqual([1])
    expect(queueFor('rejected', 'default', scaleOf(5), false)).toEqual([-1])
    expect(queueFor('unrated', 'default', scaleOf(5), false)).toEqual([0])
    expect(queueFor('all', 'default', scaleOf(5), false)).toEqual([undefined])
  })
  it('does not filter for an admin or a comments-only round', () => {
    expect(queueFor('accepted', 'rating', scaleOf(5), true)).toEqual([undefined])
    expect(queueFor('rejected', 'rating', scaleOf(0), false)).toEqual([undefined])
  })
})

describe('groupByRegion', () => {
  it('groups by the region of the monument, "no region" last', () => {
    const mk = (id: string, monumentId: string | null) => ({
      image: { pageId: id, title: id, width: 1, height: 1, monumentId }, selections: [], totalRate: 0, rateSum: 0
    })
    const groups = groupByRegion([mk('a', '80-1-1'), mk('b', null), mk('c', '46-1-1'), mk('d', '46-2-2')])
    // alphabetical by the Ukrainian name: Київ, Львівська; then the photos without a region
    expect(groups.map((g) => g.key)).toEqual(['80', '46', 'none'])
    expect(groups[1].items).toHaveLength(2)
    expect(groups[1].title).toBe('Львівська (2)')
  })
})

describe('GalleryPage (mock backend)', () => {
  it('rates from the detail view with the round\'s own scale (1-10)', async () => {
    setup(['jury'], '2', '12')
    const tiles = await screen.findAllByRole('button', { name: /Photo 1\.jpg/ })
    await userEvent.click(tiles[0])
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('10 Stars')).toBeInTheDocument()
    fireEvent.click(within(dialog).getByLabelText('4 Stars'))
    fireEvent.click(within(dialog).getByLabelText('Закрити'))
    await waitFor(() => expect(screen.getAllByText('4★').length).toBeGreaterThan(0))
  }, 15000)

  it('rates straight from the tile, without opening the photo, and counts the votes', async () => {
    // round 31: 1-3 with the reject mark; its own round, so a late save of another test can't leak in
    setup(['jury'], '2', '31')
    await screen.findAllByRole('button', { name: /Photo 1\.jpg/ })
    // (queries by label are very slow with hundreds of stars in the DOM: go by text and selectors)
    const all = await screen.findByText(/^Усі /)
    const chips = all.closest('[aria-label="Статистика оцінок"]') as HTMLElement
    await waitFor(() => expect(within(chips).getByText('Усі 60')).toBeInTheDocument())
    expect(within(chips).getByText('Без оцінки 60')).toBeInTheDocument()

    fireEvent.click(document.querySelector('.wlx-quick input[value="2"]') as Element)
    await waitFor(() => expect(within(chips).getByText('Прийняті 1')).toBeInTheDocument())
    expect(within(chips).getByText('Без оцінки 59')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(document.querySelectorAll('.wlx-quick [aria-label="Відхилити"]')[1])
    await waitFor(() => expect(within(chips).getByText('Відхилені 1')).toBeInTheDocument())
  }, 15000)

  it('a yes/no round gives select / reject buttons on the tile, and the size slider to a screener', async () => {
    setup(['screener'], '3', '11')
    expect(await screen.findByLabelText('Розмір фото')).toBeInTheDocument()
    expect((await screen.findAllByLabelText('Відібрати')).length).toBeGreaterThan(0)
    expect(screen.getAllByLabelText('Відхилити').length).toBeGreaterThan(0)
  }, 15000)

  it('a 1-5 round without the reject mark has no reject button and no "rejected" counter', async () => {
    setup(['jury'], '2', '21')
    await screen.findAllByRole('button', { name: /Photo 1\.jpg/ })
    await screen.findByText(/^Усі /)
    expect(screen.queryByText(/^Відхилені/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Відхилити')).not.toBeInTheDocument()
  }, 15000)

  it('groups the photos by region when sorted by region', async () => {
    setup(['jury'], '2', '12')
    await screen.findAllByRole('button', { name: /Photo 1\.jpg/ })
    await userEvent.click(screen.getByRole('combobox'))
    await userEvent.click(await screen.findByRole('option', { name: 'За областями' }))
    expect(await screen.findByText(/^Львівська \(/)).toBeInTheDocument()
    expect(screen.getByText(/^Київ \(/)).toBeInTheDocument()
    await act(async () => {})
  }, 15000)
})
