import { readFileSync } from 'node:fs'
import { buildSchema, parse, validate } from 'graphql'
import * as D from './documents'

// ui/schema/schema.graphql is a copy of conf/graphql/schema.graphql (the backend's schema);
// every query the UI sends must be valid against it.
const source = readFileSync(`${process.cwd()}/schema/schema.graphql`, 'utf8')
const schema = buildSchema(source)

// the fields the UI would like the backend to add to Round (README, "Backend wishes")
const wished = buildSchema(`${source}\nextend type Round { rates: Int! rejects: Boolean! }`)

describe('GraphQL documents', () => {
  for (const [name, doc] of Object.entries(D)) {
    if (typeof doc !== 'string') continue
    const optional = D.OPTIONAL_DOCUMENTS.includes(name)
    it(`${name} is valid against the ${optional ? 'wished' : 'backend'} schema`, () => {
      expect(validate(optional ? wished : schema, parse(doc))).toEqual([])
    })
  }
  it('the optional documents are NOT in the current backend schema (remove from OPTIONAL_DOCUMENTS once added)', () => {
    for (const name of D.OPTIONAL_DOCUMENTS) {
      expect(validate(schema, parse((D as unknown as Record<string, string>)[name])).length).toBeGreaterThan(0)
    }
  })
})
