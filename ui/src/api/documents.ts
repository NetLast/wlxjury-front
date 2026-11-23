// Queries for the Sangria schema (app/graphql). Operation names are unique: the mock backend
// (mock/mockResolve.ts) dispatches on them.

const USER = `id fullname email roles contestId`

export const LOGIN = `mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) { token user { ${USER} } }
}`

export const ME = `query Me { me { ${USER} } }`

export const CONTESTS = `query Contests {
  contests { id name year country campaign currentRound
    rounds { id number name contestId active distribution category } }
}`

export const ROUND = `query Round($id: ID!) {
  round(id: $id) { id number name contestId active distribution category hasCriteria }
}`

export const IMAGES = `query Images($roundId: ID!, $userId: ID, $page: Int, $pageSize: Int, $rate: Int, $region: String) {
  images(roundId: $roundId, userId: $userId, page: $page, pageSize: $pageSize, rate: $rate, region: $region) {
    totalRate rateSum rank
    selections { rate }
    image { pageId title url pageUrl width height author monumentId mime mpx }
  }
}`

export const RATE_IMAGE = `mutation RateImage($roundId: ID!, $pageId: ID!, $rate: Int!) {
  rateImage(roundId: $roundId, pageId: $pageId, rate: $rate) { pageId rate }
}`

export const COMMENTS = `query Comments($roundId: ID!, $imagePageId: ID) {
  comments(roundId: $roundId, imagePageId: $imagePageId) { id username body createdAt imagePageId }
}`

export const ADD_COMMENT = `mutation AddComment($roundId: ID!, $imagePageId: ID!, $body: String!) {
  addComment(roundId: $roundId, imagePageId: $imagePageId, body: $body) { id username body createdAt imagePageId }
}`

export const ROUND_STAT = `query RoundStat($roundId: ID!) {
  roundStat(roundId: $roundId) { roundId totalImages ratedImages
    jurorStats { rated selected user { id fullname } } }
}`

/** All of a user's votes in a round, tiny (page id + rate): the counts of accepted / rejected / unrated. */
export const RATE_SUMMARY = `query RateSummary($roundId: ID!, $userId: ID, $pageSize: Int) {
  images(roundId: $roundId, userId: $userId, page: 1, pageSize: $pageSize) {
    image { pageId } selections { rate }
  }
}`

/**
 * OPTIONAL: the round's rating scale. The backend's Round type does not expose `rates` / `rejects`
 * yet (see ui/README.md, "Backend wishes"); the UI falls back to a default scale while this fails.
 */
export const ROUND_SCALE = `query RoundScale($id: ID!) { round(id: $id) { rates rejects } }`

/** Documents the backend schema does not have yet: checked against the schema plus the wished fields. */
export const OPTIONAL_DOCUMENTS = ['ROUND_SCALE']
