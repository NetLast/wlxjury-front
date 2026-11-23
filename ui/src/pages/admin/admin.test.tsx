import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import AdminPage from '../AdminPage'
import { applyFilter, emptyFilter } from './filters'
import { mockContests } from '../../mock/mockData'
import { store } from '../../store/store'
import { signedIn } from '../../store/authSlice'

describe('applyFilter', () => {
  it('filters by country, year and campaign text', () => {
    expect(applyFilter(mockContests, { ...emptyFilter, country: 'Poland' }).map((c) => c.id)).toEqual(['3'])
    expect(applyFilter(mockContests, { ...emptyFilter, year: 2024 }).map((c) => c.id)).toEqual(['1'])
    expect(applyFilter(mockContests, { ...emptyFilter, campaign: 'WLM-UA' }).map((c) => c.id)).toEqual(['2'])
    expect(applyFilter(mockContests, emptyFilter)).toHaveLength(3)
  })
})

describe('AdminPage (mock backend)', () => {
  beforeEach(() => {
    store.dispatch(signedIn({ token: 't', user: { id: '1', fullname: 'A', email: 'a@x', roles: ['admin'] } }))
  })
  const mount = () => render(<Provider store={store}><MemoryRouter><AdminPage /></MemoryRouter></Provider>)

  it('lists campaigns and totals the statistics over the rounds', async () => {
    mount()
    expect(await screen.findByText('Wiki Loves Earth')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('tab', { name: 'Статистика' }))
    // 240 + 40 + 120 + 60 mock photos
    await waitFor(() => expect(screen.getByText(/Загалом: 0 з 460 фото/)).toBeInTheDocument(), { timeout: 4000 })
    const years = screen.getByRole('table', { name: 'Статистика по роках' })
    expect(within(years).getByText('2022')).toBeInTheDocument()
  })

  it('previews the Commons category of a new campaign', async () => {
    mount()
    await userEvent.click(screen.getByRole('tab', { name: 'Нова кампанія' }))
    await userEvent.type(screen.getByLabelText('Категорія на Commons'), 'Test cat')
    expect(await screen.findByText('Попередній перегляд категорії', undefined, { timeout: 3000 })).toBeInTheDocument()
    await waitFor(() => expect(screen.getAllByRole('img').length).toBeGreaterThan(0))
  })
})
