import { mockComments, mockContests, mockImagesByRound, mockUsers } from './mockData'
import type { CommentInfo, ImageWithRating } from '../types'

type Vars = Record<string, unknown>

const delay = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 120))

/** Answers the operations of api/documents.ts from memory. */
export async function mockResolve(operation: string, vars: Vars, userId?: string): Promise<unknown> {
  switch (operation) {
    case 'Login': {
      const u = mockUsers[String(vars.email)]
      if (!u || u.password !== vars.password) throw new Error('Invalid email or password')
      const { password: _p, ...user } = u
      return delay({ login: { token: `mock-${user.id}`, user } })
    }
    case 'Me': {
      const u = Object.values(mockUsers).find((x) => x.id === userId)
      if (!u) throw new Error('Not authenticated')
      const { password: _p, ...user } = u
      return delay({ me: user })
    }
    case 'Contests':
      return delay({ contests: mockContests })
    case 'Round': {
      const round = mockContests.flatMap((c) => c.rounds).find((r) => r.id === vars.id)
      return delay({ round })
    }
    case 'Images': {
      const all = mockImagesByRound[String(vars.roundId)] ?? []
      const mine = (x: ImageWithRating) => (x.selections[0]?.rate ?? 0)
      const filtered = vars.rate == null ? all : all.filter((x) => mine(x) === vars.rate)
      const page = Number(vars.page ?? 1)
      const size = Number(vars.pageSize ?? 40)
      return delay({ images: filtered.slice((page - 1) * size, page * size) })
    }
    case 'RateImage': {
      const list = mockImagesByRound[String(vars.roundId)] ?? []
      const item = list.find((x) => x.image.pageId === vars.pageId)
      if (!item) throw new Error('not found')
      item.selections = [{ rate: Number(vars.rate) }]
      item.rateSum = Number(vars.rate)
      return delay({ rateImage: { rate: Number(vars.rate), pageId: String(vars.pageId) } })
    }
    case 'Comments': {
      const list = mockComments.filter((c) => c.imagePageId === vars.imagePageId)
      return delay({ comments: list })
    }
    case 'AddComment': {
      const u = Object.values(mockUsers).find((x) => x.id === userId)
      const c: CommentInfo = {
        id: String(mockComments.length + 1),
        username: u?.fullname ?? 'anonymous',
        body: String(vars.body),
        createdAt: new Date().toISOString(),
        imagePageId: String(vars.imagePageId)
      }
      mockComments.push(c)
      return delay({ addComment: c })
    }
    case 'RoundStat': {
      const list = mockImagesByRound[String(vars.roundId)] ?? []
      const rated = list.filter((x) => x.selections.length > 0).length
      return delay({
        roundStat: {
          roundId: String(vars.roundId), totalImages: list.length, ratedImages: rated,
          jurorStats: Object.values(mockUsers).filter((u) => u.roles.includes('jury')).map((u) => ({
            user: { id: u.id, fullname: u.fullname }, rated, selected: list.filter((x) => (x.selections[0]?.rate ?? 0) > 0).length
          }))
        }
      })
    }
    default:
      throw new Error(`mock: unknown operation ${operation}`)
  }
}
