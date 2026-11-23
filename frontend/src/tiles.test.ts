import { page } from './fixture'
import { readSetup, readTexts, readTiles, sourcesOf } from './tiles'

describe('reading the page', () => {
  it('reads the files from the server-rendered images', () => {
    const [a, b] = readTiles(page())
    expect(a).toMatchObject({
      pageId: '11', roundId: '7', title: 'File:A b.jpg', width: 1500, height: 1000, rate: 0,
      largeUrl: '/large/round/7/user/2/pageid/11', monumentId: '46-101-0001', author: null, description: null,
      comments: 2, commentsLabel: 'two: open the comments'
    })
    expect(b).toMatchObject({ pageId: '12', rate: -1, monumentId: null, comments: 0 })
  })
  it('reads the author and the description only where the page has them', () => {
    const [a] = readTiles(page({ org: true }))
    expect(a.author).toBe('Ann')
    expect(a.description).toBe('{{en|1=Old [[church]]}}')
  })
  it('turns the 1x / 1.5x / 2x thumbnails into width-described sources', () => {
    const [a, b] = readTiles(page())
    expect(a.srcSet.map((s) => s.width)).toEqual([375, 563, 750])
    expect(a.srcSet[0]).toEqual({ src: '/w/thumb/a/ab/A.jpg/375px-A.jpg', width: 375, height: 250 })
    // the original file (no "NNNpx-"): the file's own width
    expect(b.srcSet).toEqual([{ src: '/w/c/B.jpg', width: 300, height: 600 }])
  })
  it('reads the round setup and the texts', () => {
    expect(readSetup(page())).toEqual({ jury: true, binary: true, stars: null, viewVotes: false })
    expect(readSetup(page({ binary: false, stars: '{"number":5,"half":true,"worst":true}' })).stars)
      .toEqual({ number: 5, half: true, worst: true })
    expect(readSetup(page({ stars: '{bad' })).stars).toBeNull()
    const g = page()
    expect(readTexts(g, document.querySelector('[data-csrf-token]'))).toMatchObject({ selected: 'Selected', monument: 'Monument: {0}', author: 'Author' })
  })
  it('keeps one source per width', () => {
    const img = document.createElement('img')
    img.setAttribute('src', '/t/100px-x.jpg')
    img.setAttribute('srcset', '/t/100px-x.jpg 1.5x, , /t/200px-x.jpg 2x')
    expect(sourcesOf(img, 1000, 500).map((s) => s.width)).toEqual([100, 200])
  })
})
