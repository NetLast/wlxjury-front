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
