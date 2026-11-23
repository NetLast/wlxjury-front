import type { Role, User } from '../types'

/**
 * Maps the backend role strings to the three UI roles.
 * Backend today: "root", "admin", "jury". "prejury"/"screener" are accepted for the
 * screener ("відсіювач") role, which the backend does not have yet.
 */
export function roleOf(user: Pick<User, 'roles'> | null | undefined): Role | null {
  const roles = user?.roles ?? []
  if (roles.includes('root') || roles.includes('admin')) return 'admin'
  if (roles.includes('jury')) return 'jury'
  if (roles.includes('screener') || roles.includes('prejury')) return 'screener'
  return null
}

export const homePath = (role: Role | null): string =>
  role === 'admin' ? '/admin' : role ? '/rounds' : '/login'
