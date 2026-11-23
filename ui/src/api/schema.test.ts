import { readFileSync } from 'node:fs'
import { buildSchema, parse, validate } from 'graphql'
import * as D from './documents'

// ui/schema/schema.graphql is a copy of conf/graphql/schema.graphql (the backend's schema);
// every query the UI sends must be valid against it.
const schema = buildSchema(readFileSync(`${process.cwd()}/schema/schema.graphql`, 'utf8'))

describe('GraphQL documents', () => {
  for (const [name, doc] of Object.entries(D)) {
    it(`${name} is valid against the backend schema`, () => {
      expect(validate(schema, parse(doc as string))).toEqual([])
    })
  }
})
