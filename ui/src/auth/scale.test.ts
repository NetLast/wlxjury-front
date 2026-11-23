import { fallbackScale, positiveRates, scaleOf } from './scale'

describe('scaleOf', () => {
  it('maps the backend rates id', () => {
    expect(scaleOf(0).kind).toBe('comments')
    expect(scaleOf(1)).toEqual({ kind: 'binary', max: 1, rejects: true })
    expect(scaleOf(10, false)).toEqual({ kind: 'rated', max: 10, rejects: false })
    expect(scaleOf(3).rejects).toBe(true)
  })
  it('lists positive rates from the best', () => {
    expect(positiveRates(scaleOf(4))).toEqual([4, 3, 2, 1])
    expect(positiveRates(scaleOf(1))).toEqual([1])
    expect(positiveRates(scaleOf(0))).toEqual([])
  })
  it('has a fallback per role', () => {
    expect(fallbackScale('jury').max).toBe(5)
    expect(fallbackScale('screener').kind).toBe('binary')
  })
})
