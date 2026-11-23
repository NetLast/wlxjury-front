import { NO_REGION, regionName, regionOf } from './regions'

describe('regionOf', () => {
  it('reads the KOATUU code from a monument id', () => {
    expect(regionOf('46-101-0012')).toBe('46')
    expect(regionName('46')).toBe('Львівська')
  })
  it('falls back to "no region"', () => {
    expect(regionOf(undefined)).toBe(NO_REGION)
    expect(regionOf('99-1-1')).toBe(NO_REGION)
    expect(regionOf('')).toBe(NO_REGION)
    expect(regionName(NO_REGION)).toBe('Без області')
  })
})
