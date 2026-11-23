export type Role = 'admin' | 'jury' | 'screener'

export interface User {
  id: string
  fullname: string
  email: string
  roles: string[]
  contestId?: string | null
}

export interface Round {
  id: string
  number: number
  name?: string | null
  contestId: string
  active: boolean
  distribution: number
  category?: string | null
  hasCriteria?: boolean
}

export interface ContestInfo {
  id: string
  name: string
  year: number
  country: string
  campaign?: string | null
  currentRound?: string | null
  rounds: Round[]
}

export interface ImageInfo {
  pageId: string
  title: string
  url?: string | null
  pageUrl?: string | null
  width: number
  height: number
  author?: string | null
  monumentId?: string | null
  mime?: string | null
  mpx?: number | null
}

export interface Selection {
  rate: number
}

export interface ImageWithRating {
  image: ImageInfo
  selections: Selection[]
  totalRate: number
  rateSum: number
  rank?: number | null
}

export interface CommentInfo {
  id: string
  username: string
  body: string
  createdAt: string
  imagePageId: string
}

export interface JurorStat {
  user: { id: string; fullname: string }
  rated: number
  selected: number
}

export interface RoundStat {
  roundId: string
  totalImages: number
  ratedImages: number
  jurorStats: JurorStat[]
}
