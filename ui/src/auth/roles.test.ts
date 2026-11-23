import { roleOf } from './roles'

describe('roleOf', () => {
  it('maps backend roles to UI roles', () => {
    expect(roleOf({ roles: ['root'] })).toBe('admin')
    expect(roleOf({ roles: ['admin', 'USER_ID_5'] })).toBe('admin')
    expect(roleOf({ roles: ['jury'] })).toBe('jury')
    expect(roleOf({ roles: ['prejury'] })).toBe('screener')
    expect(roleOf({ roles: [] })).toBeNull()
    expect(roleOf(null)).toBeNull()
  })
})
