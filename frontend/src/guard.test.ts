import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

// The bundle (public/gallery-island/) is outside the app's script guards, which scan
// public/javascripts: the island's own source keeps their rules here instead
// (secure-coding §8: no raw HTML sinks; ui/practices §1.1, §2.1: no literal UI texts, no inline code).
const dir = join(process.cwd(), 'src')
const sources = readdirSync(dir)
  .filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && f !== 'fixture.ts' && f !== 'test-setup.ts')
  .map((f) => [f, readFileSync(join(dir, f), 'utf8')] as const)

describe('the island source', () => {
  it('has no raw HTML sinks', () => {
    for (const [f, text] of sources) {
      expect([f, /dangerouslySetInnerHTML|\.innerHTML\b|\.outerHTML\b|insertAdjacentHTML|document\.write|\beval\(|new Function/.test(text)])
        .toEqual([f, false])
    }
  })
  it('has no Cyrillic UI texts: they come from the page', () => {
    for (const [f, text] of sources) expect([f, /[А-Яа-яЇїІіЄєҐґ]/.test(text)]).toEqual([f, false])
  })
})
