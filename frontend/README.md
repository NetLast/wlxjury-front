# frontend/ — React islands in the Play pages

The app's pages stay Play/Twirl. A React "island" takes over one part of a page; the first is the
**gallery tiles** (`gallery.scala.html`), in place of the vendored unitegallery (docs/ui/practices.md §7).

| | |
|---|---|
| Source | `frontend/src/` (React 19, [react-photo-album](https://react-photo-album.com/) rows layout) |
| Built into | `public/gallery-island/gallery-island.js` and `.css` (committed: `sbt run` and `sbt dist` need no npm) |
| Loaded by | `app/views/snippets/galleryIsland.scala.html`, on the gallery page |
| Mounts on | `#gallery[data-island]`; `gallery-init.js` then doesn't start unitegallery |
| Old tiles | add `?tiles=classic` to the page's address |

**Requires Node.js 20.19+ or 22.12+.**

## What the island does

- Reads everything from the page as the server rendered it: `#gallery`'s attributes (`views.GalleryTiles`:
  who votes, binary or rated, stars, half stars, worst mark) and one `<img>` per file with its `data-*`.
  It asks the server for nothing, so the server's rules decide who sees what.
- Justified rows; the thumbnails the page offers (1x, 1.5x, 2x) become a width-described `srcSet`, so each
  tile loads the smallest sharp one.
- **The card's description** at the top of each tile: the title; for those who see the round's organizer
  views, the author and the file description (wikitext turned into text); for jurors the monument only
  (an author's name must not reach a juror, secure-coding §22). Two lines at rest, all of it on hover / focus.
- Votes as `tile-votes.js` sends them (`POST /rate/round/…/select/…` with the `Csrf-Token` header), one at
  a time per file, put back and explained by `vote-errors.js` when refused; ✓ / ✗, stars, half stars, worst mark, clear.
- A click on the tile opens the existing large view (`data-largeUrl`).
- Chips: the vote (read-only views), the all-jurors tally of a binary round, the comments count.
- All texts come from the page (`voteTexts`, `data-label-*`), so the four languages keep working.

Not carried over yet: the vote-time chip and order (`data-voted-at`), contestFiles' tiles (still unitegallery).

## Develop

```bash
cd frontend
npm install
npm run dev      # the demo page: the template's markup with fake thumbnails and votes, no Play needed
npm test         # vitest: page reading, votes, captions, wikitext, guards
npm run build    # rebuilds public/gallery-island/ — commit it together with the source change
```

The demo (`demo/index.html?mode=binary|rated|org`) answers a vote of 7 (3.5★) with "round closed".

## Rules the island keeps

`src/guard.test.ts` checks the island's own source for what the app's script guards check in
`public/javascripts/` (which don't scan the bundle): no raw HTML sinks, no `eval`, no literal UI texts.
The bundle is one classic script and one stylesheet served from this host (CSP `script-src 'self'`).
