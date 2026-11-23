import type { CommentInfo, ContestInfo, ImageWithRating, User } from '../types'

/** In-memory fake backend so the UI runs without Play/MariaDB (`npm run dev:mock`). */

export const mockUsers: Record<string, User & { password: string }> = {
  'admin@example.org': { id: '1', fullname: 'Адмін Адміненко', email: 'admin@example.org', roles: ['admin'], password: 'admin' },
  'jury@example.org': { id: '2', fullname: 'Журі Журенко', email: 'jury@example.org', roles: ['jury'], password: 'jury' },
  'screener@example.org': { id: '3', fullname: 'Відсіювач Відсіяйко', email: 'screener@example.org', roles: ['screener'], password: 'screener' }
}

export const mockContests: ContestInfo[] = [
  {
    id: '1', name: 'Вікі любить Землю', year: 2024, country: 'Ukraine', campaign: 'wle-ua', currentRound: '11',
    rounds: [
      { id: '11', number: 1, name: 'Перший тур', contestId: '1', active: true, distribution: 0 },
      { id: '12', number: 2, name: 'Фінал', contestId: '1', active: false, distribution: 0 }
    ]
  },
  {
    id: '3', name: 'Wiki Loves Earth', year: 2022, country: 'Poland', campaign: 'wle-pl', currentRound: '31',
    rounds: [{ id: '31', number: 1, name: 'Round 1', contestId: '3', active: false, distribution: 0 }]
  },
  {
    id: '2', name: 'Вікі любить пам’ятки', year: 2023, country: 'Ukraine', campaign: 'wlm-ua', currentRound: '21',
    rounds: [{ id: '21', number: 1, name: 'Перший тур', contestId: '2', active: true, distribution: 0 }]
  }
]

const COLORS = ['#2e7d32', '#1565c0', '#6a1b9a', '#ef6c00', '#00838f', '#ad1457', '#4e342e']
const SIZES: [number, number][] = [[1600, 1067], [1067, 1600], [1600, 900], [1200, 1200], [2400, 1000]]
const AUTHORS = ['Олена', 'Іван', 'Марія', 'Петро', 'Соломія']

function svg(w: number, h: number, color: string, label: string): string {
  const s = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${color}"/><stop offset="1" stop-color="#101820"/></linearGradient></defs>
<rect width="100%" height="100%" fill="url(#g)"/>
<text x="50%" y="50%" fill="#fff" fill-opacity=".85" font-family="sans-serif" font-size="${Math.round(w / 12)}" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(s)}`
}

function makeImages(roundId: string, count: number): ImageWithRating[] {
  return Array.from({ length: count }, (_, i) => {
    const [width, height] = SIZES[i % SIZES.length]
    const pageId = `${roundId}${String(i + 1).padStart(4, '0')}`
    const thumbW = 640
    return {
      image: {
        pageId,
        title: `File:Photo ${i + 1}.jpg`,
        // the thumbnail keeps the real aspect ratio, so the layout matches the final image
        url: svg(thumbW, Math.round((thumbW * height) / width), COLORS[i % COLORS.length], `#${i + 1}`),
        pageUrl: `https://commons.wikimedia.org/wiki/File:Photo_${i + 1}.jpg`,
        width, height,
        author: AUTHORS[i % AUTHORS.length],
        mime: 'image/jpeg',
        mpx: Math.round((width * height) / 1e5) / 10
      },
      selections: [],
      totalRate: 0, rateSum: 0, rank: null
    }
  })
}

export const mockImagesByRound: Record<string, ImageWithRating[]> = {
  '11': makeImages('11', 240),
  '12': makeImages('12', 40),
  '21': makeImages('21', 120),
  '31': makeImages('31', 60)
}

export const mockComments: CommentInfo[] = []
