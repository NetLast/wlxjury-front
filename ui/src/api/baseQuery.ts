import { ClientError, GraphQLClient } from 'graphql-request'
import type { BaseQueryFn } from '@reduxjs/toolkit/query/react'
import { mockResolve } from '../mock/mockResolve'
import type { RootState } from '../store/store'

export const USE_MOCK = import.meta.env.VITE_MOCK === '1'

const endpoint = new URL('/graphql', window.location.origin).toString()

export interface GqlArgs {
  /** the document text; its operation name is also used by the mock backend */
  document: string
  variables?: Record<string, unknown>
}

export interface GqlError {
  message: string
  code?: string
}

const operationName = (doc: string) => /(?:query|mutation)\s+(\w+)/.exec(doc)?.[1] ?? ''

export const graphqlBaseQuery: BaseQueryFn<GqlArgs, unknown, GqlError> = async (args, api) => {
  const { token, user } = (api.getState() as RootState).auth
  try {
    if (USE_MOCK) return { data: await mockResolve(operationName(args.document), args.variables ?? {}, user?.id) }
    const client = new GraphQLClient(endpoint, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    })
    return { data: await client.request(args.document, args.variables) }
  } catch (e) {
    if (e instanceof ClientError) {
      const first = e.response.errors?.[0]
      return { error: { message: first?.message ?? 'Request failed', code: first?.extensions?.code as string | undefined } }
    }
    return { error: { message: e instanceof Error ? e.message : 'Request failed' } }
  }
}
