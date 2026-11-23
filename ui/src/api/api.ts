import { createApi } from '@reduxjs/toolkit/query/react'
import { graphqlBaseQuery } from './baseQuery'
import * as D from './documents'
import type {
  CommentInfo, ContestInfo, ImageWithRating, Round, RoundStat, User
} from '../types'

export const api = createApi({
  reducerPath: 'gql',
  baseQuery: graphqlBaseQuery,
  tagTypes: ['Comments'],
  endpoints: (b) => ({
    login: b.mutation<{ token: string; user: User }, { email: string; password: string }>({
      query: (variables) => ({ document: D.LOGIN, variables }),
      transformResponse: (r: { login: { token: string; user: User } }) => r.login
    }),
    contests: b.query<ContestInfo[], void>({
      query: () => ({ document: D.CONTESTS }),
      transformResponse: (r: { contests: ContestInfo[] }) => r.contests
    }),
    round: b.query<Round, string>({
      query: (id) => ({ document: D.ROUND, variables: { id } }),
      transformResponse: (r: { round: Round }) => r.round
    }),
    images: b.query<ImageWithRating[], { roundId: string; userId?: string; page: number; pageSize: number; rate?: number }>({
      query: (variables) => ({ document: D.IMAGES, variables }),
      transformResponse: (r: { images: ImageWithRating[] }) => r.images
    }),
    rateImage: b.mutation<{ pageId: string; rate: number }, { roundId: string; pageId: string; rate: number }>({
      query: (variables) => ({ document: D.RATE_IMAGE, variables }),
      transformResponse: (r: { rateImage: { pageId: string; rate: number } }) => r.rateImage
    }),
    comments: b.query<CommentInfo[], { roundId: string; imagePageId: string }>({
      query: (variables) => ({ document: D.COMMENTS, variables }),
      transformResponse: (r: { comments: CommentInfo[] }) => r.comments,
      providesTags: (_r, _e, a) => [{ type: 'Comments', id: a.imagePageId }]
    }),
    addComment: b.mutation<CommentInfo, { roundId: string; imagePageId: string; body: string }>({
      query: (variables) => ({ document: D.ADD_COMMENT, variables }),
      transformResponse: (r: { addComment: CommentInfo }) => r.addComment,
      invalidatesTags: (_r, _e, a) => [{ type: 'Comments', id: a.imagePageId }]
    }),
    roundScale: b.query<{ rates: number; rejects: boolean }, string>({
      query: (id) => ({ document: D.ROUND_SCALE, variables: { id } }),
      transformResponse: (r: { round: { rates: number; rejects: boolean } }) => r.round
    }),
    rateSummary: b.query<Record<string, number>, { roundId: string; userId: string }>({
      query: (v) => ({ document: D.RATE_SUMMARY, variables: { ...v, pageSize: 100000 } }),
      transformResponse: (r: { images: { image: { pageId: string }; selections: { rate: number }[] }[] }) =>
        Object.fromEntries(r.images.map((x) => [x.image.pageId, x.selections[0]?.rate ?? 0]))
    }),
    roundStat: b.query<RoundStat, string>({
      query: (roundId) => ({ document: D.ROUND_STAT, variables: { roundId } }),
      transformResponse: (r: { roundStat: RoundStat }) => r.roundStat
    })
  })
})

export const {
  useLoginMutation, useContestsQuery, useRoundQuery, useLazyImagesQuery,
  useRateImageMutation, useRoundScaleQuery, useRateSummaryQuery, useCommentsQuery, useAddCommentMutation, useRoundStatQuery
} = api
