/**
 * Builds the markup gallery.scala.html renders (voteTexts on the row, #gallery with
 * GalleryTiles' attributes, one <img> per file), then starts the island on it, as the real page.
 * ?mode=binary | rated | org.
 */
const mode = new URLSearchParams(location.search).get('mode') ?? 'binary'
const org = mode === 'org'
const rated = mode === 'rated'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

const DESCRIPTIONS = [
  "{{uk|1=Церква Святого Миколая, [[Львів]]. Дерев'яна, XVII ст.}}{{en|1=St. Nicholas church, Lviv.}}",
  "{{uk|1=Вид на '''Карпати''' з полонини на світанку}}",
  '',
  "{{uk|1=Замок у місті [[Кам'янець-Подільський|Кам’янці-Подільському]], вигляд з мосту &amp; річки}}",
  'Old mill on the river, [https://example.org photo walk] 2023'
]
const SIZES: [number, number][] = [[1600, 1067], [1067, 1600], [1600, 900], [1200, 1200], [2400, 1000]]
const REGIONS = ['46', '05', '07', '80', '26']

const tiles = Array.from({ length: 30 }, (_, i) => {
  const [w, h] = SIZES[i % SIZES.length]
  const name = `Photo_${i + 1}.jpg`
  const thumb = (px: number) => `/thumbs/${w}x${h}/${px}px-${name}`
  const rowPx = (y: number) => Math.round((w * y) / h)
  const rate = i % 7 === 2 ? (org ? 0 : rated ? 6 : 1) : i % 7 === 4 ? -1 : 0
  return `<img alt="${esc(`<a href='https://commons.wikimedia.org/wiki/File:${name}'>File:${name}</a>`)}"
    src="${thumb(rowPx(250))}" srcset="${thumb(rowPx(375))} 1.5x, ${thumb(rowPx(500))} 2x"
    data-image="${thumb(1280)}" data-width="${w}" data-height="${h}"
    data-description="${esc(`<b>File:${name}</b>`)}" data-pageId="${1000 + i}" data-roundId="11" data-rate="${rate}"
    data-largeUrl="#large-${1000 + i}"
    data-monument-id="${i % 6 === 5 ? '' : `${REGIONS[i % REGIONS.length]}-101-${String(i).padStart(4, '0')}`}"
    ${org ? `data-author="Автор ${(i % 4) + 1}" data-desc="${esc(DESCRIPTIONS[i % DESCRIPTIONS.length])}"` : ''}
    ${org && !rated ? `data-approvals="${i % 3}" data-rejections="${i % 2}" data-tally="Схвалень: ${i % 3}, відхилень: ${i % 2}"` : ''}
    ${i % 5 === 1 ? 'data-comments="2" data-comments-label="Два: відкрити коментарі"' : ''}>`
}).join('\n')

const stars = rated ? esc('{"number":5,"half":true,"worst":true}') : ''
document.getElementById('page')!.innerHTML = `
<div class="row" data-csrf-token="demo-token"
  data-vote-signed-out="Ви вийшли з системи. Увійдіть знову й перезавантажте сторінку."
  data-vote-expired="Термін дії сторінки минув. Перезавантажте її та проголосуйте ще раз."
  data-vote-closed="Голосування в цьому раунді закрите." data-vote-paused="Файли перерозподіляються."
  data-vote-invalid-rate="Цей раунд не приймає такої оцінки." data-vote-not-found="Цей файл вам більше не призначено."
  data-vote-forbidden="Ви більше не можете голосувати в цьому раунді." data-vote-selected="Вибрані" data-vote-rejected="Відкинуті"
  data-vote-worst="Найгірша оцінка" data-vote-clear="Зняти оцінку" data-vote-failed="Не вдалося зберегти ваш голос."
  data-vote-reference="Код: {0}" data-comments-open="{0}: відкрити коментарі" data-vote-login-url="">
  <div id="gallery" class="gallery" style="display:none;" data-island
    data-label-author="Автор" data-label-monument="Пам’ятка: {0}" data-label-close="Закрити"
    data-label-previous="Попереднє зображення" data-label-next="Наступне зображення" data-label-file-info="Про файл"
    data-label-commons="Відкрити на Commons"
    data-jury="${!org}" data-binary="${!rated}" ${stars ? `data-stars="${stars}"` : ''}>
${tiles}
  </div>
</div>`

document.getElementById('theme')!.addEventListener('click', (e) => {
  e.preventDefault()
  const html = document.documentElement
  html.dataset.bsTheme = html.dataset.bsTheme === 'dark' ? 'light' : 'dark'
})

await import('../src/main')
export {}
