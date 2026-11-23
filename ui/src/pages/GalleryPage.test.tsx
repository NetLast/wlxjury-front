import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import GalleryPage from './GalleryPage'
import { store } from '../store/store'
import { signedIn } from '../store/authSlice'

class IO { observe() {} disconnect() {} unobserve() {} }
class RO extends IO {}

// jsdom has no layout: give the photo album a container width to lay the rows out in
Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, get: () => 1200 })

function setup(roles: string[], id: string) {
  ;(globalThis as unknown as { IntersectionObserver: unknown; ResizeObserver: unknown }).IntersectionObserver = IO
  ;(globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver = RO
  store.dispatch(signedIn({ token: 't', user: { id, fullname: 'U', email: 'u@x', roles } }))
  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/rounds/12']}>
        <Routes><Route path="/rounds/:roundId" element={<GalleryPage />} /></Routes>
      </MemoryRouter>
    </Provider>
  )
}

describe('GalleryPage (mock backend)', () => {
  it('lets a juror rate a photo from the detail view', async () => {
    setup(['jury'], '2')
    const tiles = await screen.findAllByRole('button', { name: /Photo 1\.jpg/ })
    await userEvent.click(tiles[0])
    const dialog = await screen.findByRole('dialog')
    fireEvent.click(within(dialog).getByLabelText('4 Stars'))
    await userEvent.click(within(dialog).getByLabelText('Закрити'))
    await waitFor(() => expect(screen.getAllByText('4★').length).toBeGreaterThan(0))
  })

  it('gives the screener select / reject and a size slider', async () => {
    setup(['screener'], '3')
    expect(await screen.findByLabelText('Розмір фото')).toBeInTheDocument()
    expect(screen.getByLabelText('Відібрані')).toBeInTheDocument()
  })
})
