# WLX Jury UI (React)

React + Redux Toolkit (RTK Query) + MUI, gallery on `react-photo-album`, zoom on
`yet-another-react-lightbox`, forms on `react-hook-form`, hotkeys on `react-hotkeys-hook`.
It talks to the Sangria GraphQL endpoint (`POST /graphql`); the Scala backend is untouched.
Every query is checked by a test against the backend's own schema (`conf/graphql/schema.graphql`,
copied to `ui/schema/`: refresh the copy when the schema changes).

## Run without the backend (demo data)

```bash
cd ui
npm install
npm run dev:mock        # http://localhost:5173
```

Demo logins: `admin@example.org` / `admin`, `jury@example.org` / `jury`, `screener@example.org` / `screener`.

## Run against the real backend

Start Play as described in `DEV.md`, then:

```bash
cd ui && npm run dev    # http://localhost:5173, proxies /graphql and /api to http://localhost:9000
```

**Known gap in the backend:** on this branch `app.graphql.GraphQLRoute` (a Pekko HTTP route) is not
mounted anywhere. The old `ApiServer` (port 9001) that registered it no longer exists, and the REST API
now lives in Play under `/api`. Until `/graphql` is served (a small Scala change: a Play action that
runs the Sangria executor, or re-adding the Pekko server), only the demo mode and the REST-based
"Налаштування конкурсів" tab work against a real backend.

## Roles

| UI role | Backend role | Sees |
|---|---|---|
| admin | `root`, `admin` | all campaigns/rounds, grouped results, round statistics, contest settings |
| jury | `jury` | active rounds; 1-5 stars (keys 1-5), comments |
| screener | `screener` / `prejury` (**not in the backend yet**) | select / reject (keys Y / N), photo-size slider |

Role mapping lives in `src/auth/roles.ts`.

## Jury features

- **Sorting:** default, by rating, by region (oblast headers, from the monument id's KOATUU code), by name.
  "By rating" reads the rates best-first from the server (a queue of `rate` filters), so it is global, not just
  the loaded page. "By region" loads all pages first (it needs every photo).
- **Quick rating:** the bar at the bottom of a tile (hover; always visible on touch screens) rates without
  opening the photo: stars (or a menu of marks for a long scale / narrow tile), a reject mark, yes/no.
- **Counts:** chips "all / accepted / rejected / unrated" (also filters), from the user's own votes.
- **Adaptive marks:** the scale follows the round: yes/no, 1..N (N up to 20), with or without the reject mark,
  or comments only (no rating controls). Keys: 1-9 / 0 / N (stars), Y / N (yes/no).

## Backend wishes (small Scala changes, the UI works around them until then)

1. `Round.rates: Int!` and `Round.rejects: Boolean!` in `RoundResolver` (the round's rating scale):
   ```scala
   Field("rates",   IntType,     resolve = _.value.rates.id),
   Field("rejects", BooleanType, resolve = _.value.rejects),
   ```
   Until then the UI assumes 1-5 with the reject mark for jurors and yes/no for screeners. When added, add them to
   `schema/schema.graphql` and empty `OPTIONAL_DOCUMENTS` in `src/api/documents.ts` (a test reminds you).
2. `images(region: ...)` is accepted by the schema but ignored by the resolver; the UI groups by region itself.
3. `roundStat.ratedImages` / `jurorStats.rated` count only `rate = 1`, so the UI counts accepted / rejected /
   unrated from the user's own votes instead.
4. `/graphql` is not mounted (see above).

## Admin

Tabs: campaigns (sortable table, filters by country / year / campaign, a button per round to its photos),
statistics (overall and per year, same filters), new campaign (live preview of the Commons category's
thumbnails), contest settings (REST `/api/contests`, real backend only).
In any gallery: sorting by name / rating; the detail view loads photo year, camera and description
from the Commons API (no jump to Commons needed).

## Tests and build

```bash
npm test && npm run build
```
