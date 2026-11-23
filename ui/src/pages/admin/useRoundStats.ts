import { useEffect, useState } from 'react'
import { api } from '../../api/api'
import { useAppDispatch } from '../../store/hooks'
import type { RoundStat } from '../../types'

/** Stats of many rounds at once (cached by RTK Query); one failed round doesn't hide the rest. */
export function useRoundStats(roundIds: string[]) {
  const dispatch = useAppDispatch()
  const [stats, setStats] = useState<Record<string, RoundStat>>({})
  const [loading, setLoading] = useState(false)
  const key = roundIds.join(',')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all(
      roundIds.map((id) =>
        dispatch(api.endpoints.roundStat.initiate(id)).unwrap().then((s) => [id, s] as const).catch(() => null)
      )
    ).then((pairs) => {
      if (cancelled) return
      setStats(Object.fromEntries(pairs.filter((p): p is readonly [string, RoundStat] => p !== null)))
      setLoading(false)
    })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dispatch])

  return { stats, loading }
}
