import { descriptionText } from './wikitext'

describe('descriptionText', () => {
  it('picks the page language of a multilingual description', () => {
    const w = '{{uk|1=Церква, [[Львів]]}}{{en|1=Church, Lviv}}'
    expect(descriptionText(w, 'uk')).toBe('Церква, Львів')
    expect(descriptionText(w, 'en')).toBe('Church, Lviv')
    expect(descriptionText(w, 'fr')).toBe('Church, Lviv') // English when there is none in the language
  })
  it('unwraps a single language template and links, drops quotes, other templates and tags', () => {
    expect(descriptionText("{{uk|Замок у [[Кам'янець-Подільський|Кам’янці]]}}")).toBe('Замок у Кам’янці')
    expect(descriptionText("Mill, '''old''' [https://x.org walk] [http://y.org] {{Monument|1}}<br/>2023")).toBe('Mill, old walk 2023')
  })
  it('decodes entities and never returns markup', () => {
    expect(descriptionText('Rock &amp; river&nbsp;view')).toBe('Rock & river view')
    expect(descriptionText('<script>alert(1)</script>text')).toBe('alert(1)text')
  })
  it('is empty for an empty description', () => {
    expect(descriptionText('')).toBe('')
    expect(descriptionText('{{uk|1=}}')).toBe('')
  })
})
