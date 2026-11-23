/** KOATUU region codes (the first part of a monument id, "46-101-0012") with Ukrainian names. */
export const REGIONS: Record<string, string> = {
  '01': 'АР Крим', '05': 'Вінницька', '07': 'Волинська', '12': 'Дніпропетровська', '14': 'Донецька',
  '18': 'Житомирська', '21': 'Закарпатська', '23': 'Запорізька', '26': 'Івано-Франківська', '32': 'Київська',
  '35': 'Кіровоградська', '44': 'Луганська', '46': 'Львівська', '48': 'Миколаївська', '51': 'Одеська',
  '53': 'Полтавська', '56': 'Рівненська', '59': 'Сумська', '61': 'Тернопільська', '63': 'Харківська',
  '65': 'Херсонська', '68': 'Хмельницька', '71': 'Черкаська', '73': 'Чернівецька', '74': 'Чернігівська',
  '80': 'Київ', '85': 'Севастополь'
}

export const NO_REGION = 'none'

/** The region code of a monument id, or NO_REGION (unknown id, or a photo without a monument). */
export function regionOf(monumentId?: string | null): string {
  const code = monumentId?.split('-')[0]
  return code && code in REGIONS ? code : NO_REGION
}

export const regionName = (code: string): string => REGIONS[code] ?? 'Без області'
