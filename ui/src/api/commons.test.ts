import { fetchCommonsInfo } from './commons'

describe('fetchCommonsInfo (mock mode)', () => {
  it('returns demo data without touching the network', async () => {
    const spy = vi.spyOn(globalThis, 'fetch')
    const info = await fetchCommonsInfo('File:A.jpg')
    expect(info.camera).toBeTruthy()
    expect(spy).not.toHaveBeenCalled()
  })
})
