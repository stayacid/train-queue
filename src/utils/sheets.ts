import { currentGameDay } from '@/utils/gameDay'
import type { Officer, Rank, R3WeeklyTop, TripRecord } from '@/types/train'

/** ID общей таблицы Google Sheets */
export const SHEET_ID = '1eUFSWznF31sjk4twRh0DBOgzR5ep2h_RRaGXJAVjRpU'

export const TAB_JOURNAL = 'Журнал'
export const TAB_ROSTER = 'Список R4/R5'
export const TAB_TOP3 = 'Топ3 R3'

const MS_PER_DAY = 86_400_000

/**
 * URL публичного CSV-экспорта вкладки (gviz). Работает без авторизации,
 * если у таблицы включён доступ «все, у кого есть ссылка».
 */
export function csvUrl(tab: string, sheetId: string = SHEET_ID): string {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(tab)}`
}

/**
 * Скачать CSV вкладки. ВАЖНО: если вкладка не найдена, gviz вернёт 200
 * с данными ПЕРВОЙ вкладки — поэтому parseSheets дополнительно проверяет
 * форму заголовков каждой вкладки и не даст молча распарсить чужие данные.
 */
export async function fetchTabCsv(tab: string, sheetId: string = SHEET_ID): Promise<string> {
  let response: Response
  try {
    response = await fetch(csvUrl(tab, sheetId))
  } catch {
    throw new Error(
      'Не удалось подключиться к Google Sheets — сеть или прокси блокирует docs.google.com. ' +
        'Данные на странице не изменились; снапшот обновляется автоматически каждый день в 18:00 МСК.',
    )
  }
  if (!response.ok) {
    throw new Error(`Не удалось скачать вкладку «${tab}»: HTTP ${response.status}`)
  }
  return response.text()
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/**
 * Разбор CSV в формате gviz (RFC 4180): поля в кавычках, внутренняя
 * кавычка — удвоенная "". Возвращает строки из ячеек без кавычек.
 */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 1
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"') {
      inQuotes = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[i + 1] === '\n') {
        i += 1
      }
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  // Пустые строки (например, пустые строки внизу таблицы) не интересуют
  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

// ---------------------------------------------------------------------------
// Заголовки
// ---------------------------------------------------------------------------

const NAME_HEADERS = ['имя', 'никнейм', 'ник', 'ник игрока', 'player']
const DATE_HEADERS = ['дата', 'день', 'date']
const RANK_HEADERS = ['ранг', 'rank']
const PLACE_HEADERS = ['место', 'место (1-3)', 'место в тройке', 'place']
const WEEK_HEADERS = ['неделя', 'игровая неделя', 'week']

type ColumnSpec<L extends string = string> = { label: L; synonyms: readonly string[] }

/**
 * Найти обязательные столбцы в заголовке. Заголовок должен содержать
 * ровно ожидаемый набор столбцов (в любом порядке, регистр не важен) —
 * иначе, когда вкладка не найдена и gviz отдаёт первую вкладку, мы должны
 * упасть с ошибкой, а не распарсить чужие данные.
 */
function requireColumns<L extends string>(
  tab: string,
  header: string[],
  required: ReadonlyArray<ColumnSpec<L>>,
): Record<L, number> {
  if (header.length !== required.length) {
    throw new Error(
      `Вкладка «${tab}»: неожиданные заголовки (${header.join(', ')}). ` +
        `Ожидались: ${required.map((column) => column.label).join(', ')}. ` +
        'Проверьте, что вкладка не переименована.',
    )
  }
  const indices: Record<string, number> = {}
  const normalized = header.map((cell) => cell.trim().toLowerCase())
  for (const column of required) {
    const index = normalized.findIndex((cell) => column.synonyms.includes(cell))
    if (index === -1) {
      throw new Error(
        `Вкладка «${tab}»: не найден столбец «${column.label}» (заголовки: ${header.join(', ')})`,
      )
    }
    indices[column.label] = index
  }
  // Валидация выше гарантирует, что каждый label из required найден
  return indices as Record<L, number>
}

// ---------------------------------------------------------------------------
// Значения ячеек
// ---------------------------------------------------------------------------

function toIsoDate(ms: number): string {
  const date = new Date(ms)
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  return `${date.getUTCFullYear()}-${month}-${day}`
}

/**
 * Дата из таблицы. Поддерживаются ДД.ММ.ГГГГ (как в таблице), ДД/ММ/ГГГГ
 * и ISO ГГГГ-ММ-ДД. Возвращает ISO-дату (ГГГГ-ММ-ДД) или null.
 */
export function parseSheetDate(raw: string): string | null {
  const value = raw.trim()
  const dmy = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/)
  const ymd = value.match(/^(\d{4})[.-](\d{1,2})[.-](\d{1,2})$/)
  let day: number
  let month: number
  let year: number
  if (dmy) {
    day = Number(dmy[1])
    month = Number(dmy[2])
    year = Number(dmy[3])
  } else if (ymd) {
    year = Number(ymd[1])
    month = Number(ymd[2])
    day = Number(ymd[3])
  } else {
    return null
  }
  // Проверяем, что дата реально существует (31.02 и т.п.)
  const ms = Date.UTC(year, month - 1, day)
  const date = new Date(ms)
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null
  }
  return toIsoDate(ms)
}

const RANKS: readonly Rank[] = ['R3', 'R4', 'R5']

function parseRank(raw: string): Rank | null {
  const value = raw.trim().toUpperCase()
  return RANKS.includes(value as Rank) ? (value as Rank) : null
}

function parsePositiveInt(raw: string): number | null {
  const value = raw.trim()
  if (!/^\d+$/.test(value)) {
    return null
  }
  const num = Number(value)
  return Number.isSafeInteger(num) ? num : null
}

// ---------------------------------------------------------------------------
// ISO-неделя
// ---------------------------------------------------------------------------

/**
 * Понедельник (ISO-дата) указанной ISO-недели указанного года.
 * ISO-неделя 1 — неделя, содержащая 4 января (её четверг — первый
 * четверг года).
 */
export function isoWeekMondayIso(week: number, year: number): string {
  const jan4 = Date.UTC(year, 0, 4)
  const jan4Dow = (new Date(jan4).getUTCDay() + 6) % 7 + 1 // 1 — понедельник … 7 — воскресенье
  const thursdayWeek1 = jan4 + (4 - jan4Dow) * MS_PER_DAY
  return toIsoDate(thursdayWeek1 + (week - 1) * 7 * MS_PER_DAY - 3 * MS_PER_DAY)
}

/**
 * Номер недели из вкладки «Топ3 R3» (например, 47) → понедельник этой
 * недели (ISO-дата). В таблице нет года: берём текущий; если полученный
 * понедельник оказывается заметно в будущем — неделя принадлежит
 * предыдущему году (типичный случай: «52», записанная в январе).
 */
export function weekNumberToMondayIso(week: number, nowMs: number = Date.now()): string {
  let year = new Date(nowMs).getUTCFullYear()
  let monday = isoWeekMondayIso(week, year)
  if (Date.parse(monday) > nowMs + 14 * MS_PER_DAY) {
    year -= 1
    monday = isoWeekMondayIso(week, year)
  }
  return monday
}

// ---------------------------------------------------------------------------
// Разбор вкладок
// ---------------------------------------------------------------------------

export interface ParsedSheets {
  journal: TripRecord[]
  roster: Officer[]
  weeklyTop: R3WeeklyTop
  warnings: string[]
}

/**
 * Разобрать CSV трёх вкладок в данные приложения.
 *
 * Фатальные ошибки (неизвестные заголовки, кривые даты/ранги/недели) —
 * бросает Error с человекочитаемым сообщением; нефатальные — собирает
 * в warnings.
 */
export function parseSheets(
  input: { journal: string; roster: string; top3: string },
  nowMs: number = Date.now(),
): ParsedSheets {
  const warnings: string[] = []
  const journal = parseJournal(input.journal, nowMs, warnings)
  const roster = parseRoster(input.roster, warnings)
  const weeklyTop = parseTop3(input.top3, nowMs, warnings)
  return { journal, roster, weeklyTop, warnings }
}

function parseJournal(csv: string, nowMs: number, warnings: string[]): TripRecord[] {
  const rows = parseCsv(csv)
  const header = rows[0]
  if (header === undefined) {
    throw new Error('Вкладка «Журнал» пуста')
  }
  const columns = requireColumns(TAB_JOURNAL, header, [
    { label: 'Имя', synonyms: NAME_HEADERS },
    { label: 'Дата', synonyms: DATE_HEADERS },
    { label: 'Ранг', synonyms: RANK_HEADERS },
  ])
  const today = currentGameDay(nowMs)
  const trips: TripRecord[] = []
  const seen = new Set<string>()
  rows.slice(1).forEach((cells, offset) => {
    const lineNo = offset + 2 // +2: первая строка — заголовок
    const name = (cells[columns['Имя']] ?? '').trim()
    if (name === '') {
      throw new Error(`Журнал, строка ${lineNo}: пустое имя`)
    }
    const rawDate = (cells[columns['Дата']] ?? '').trim()
    const date = parseSheetDate(rawDate)
    if (date === null) {
      throw new Error(
        `Журнал, строка ${lineNo}: не распознана дата «${rawDate}» (ожидалось ДД.ММ.ГГГГ или ГГГГ-ММ-ДД)`,
      )
    }
    const rawRank = (cells[columns['Ранг']] ?? '').trim()
    const rank = parseRank(rawRank)
    if (rank === null) {
      throw new Error(`Журнал, строка ${lineNo}: неизвестный ранг «${rawRank}» (допустимо: R3, R4, R5)`)
    }
    const key = `${name}|${date}`
    if (seen.has(key)) {
      warnings.push(`Журнал: дубликат «${name}» ${date} — оставлена первая запись`)
      return
    }
    seen.add(key)
    if (date > today) {
      warnings.push(`Журнал: поездка «${name}» датирована будущим (${date})`)
    }
    trips.push({ name, date, rank })
  })
  // Сверху — свежие, как в моке и в UI
  trips.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.name.localeCompare(b.name, 'ru')))
  return trips
}

function parseRoster(csv: string, warnings: string[]): Officer[] {
  const rows = parseCsv(csv)
  const header = rows[0]
  if (header === undefined) {
    throw new Error('Вкладка «Список R4/R5» пуста')
  }
  const columns = requireColumns(TAB_ROSTER, header, [
    { label: 'Никнейм', synonyms: NAME_HEADERS },
    { label: 'Ранг', synonyms: RANK_HEADERS },
  ])
  const roster: Officer[] = []
  const seen = new Set<string>()
  rows.slice(1).forEach((cells, offset) => {
    const lineNo = offset + 2
    const name = (cells[columns['Никнейм']] ?? '').trim()
    if (name === '') {
      throw new Error(`Список R4/R5, строка ${lineNo}: пустой никнейм`)
    }
    const rawRank = (cells[columns['Ранг']] ?? '').trim()
    const rank = parseRank(rawRank)
    if (rank === null) {
      throw new Error(`Список R4/R5, строка ${lineNo}: неизвестный ранг «${rawRank}» (допустимо: R3, R4, R5)`)
    }
    if (rank === 'R3') {
      warnings.push(`Список R4/R5: «${name}» имеет ранг R3 — строка пропущена`)
      return
    }
    const key = name.toLowerCase()
    if (seen.has(key)) {
      warnings.push(`Список R4/R5: «${name}» встречается несколько раз — оставлена первая строка`)
      return
    }
    seen.add(key)
    roster.push({ name, rank })
  })
  // Порядок строк = порядок очереди
  return roster
}

function parseTop3(csv: string, nowMs: number, warnings: string[]): R3WeeklyTop {
  const rows = parseCsv(csv)
  const header = rows[0]
  if (header === undefined) {
    throw new Error('Вкладка «Топ3 R3» пуста')
  }
  const columns = requireColumns(TAB_TOP3, header, [
    { label: 'Никнейм', synonyms: NAME_HEADERS },
    { label: 'Место', synonyms: PLACE_HEADERS },
    { label: 'Неделя', synonyms: WEEK_HEADERS },
  ])
  const byWeek = new Map<string, Array<{ name: string; place: number }>>()
  rows.slice(1).forEach((cells, offset) => {
    const lineNo = offset + 2
    const name = (cells[columns['Никнейм']] ?? '').trim()
    if (name === '') {
      throw new Error(`Топ3 R3, строка ${lineNo}: пустой никнейм`)
    }
    const rawPlace = (cells[columns['Место']] ?? '').trim()
    const place = parsePositiveInt(rawPlace)
    if (place === null) {
      throw new Error(`Топ3 R3, строка ${lineNo}: не распознано место «${rawPlace}» (ожидалось число 1–3)`)
    }
    const rawWeek = (cells[columns['Неделя']] ?? '').trim()
    const week = parsePositiveInt(rawWeek)
    if (week === null || week < 1 || week > 53) {
      throw new Error(
        `Топ3 R3, строка ${lineNo}: не распознана неделя «${rawWeek}» (ожидалось номер недели, например 47)`,
      )
    }
    const monday = weekNumberToMondayIso(week, nowMs)
    const entries = byWeek.get(monday) ?? []
    entries.push({ name, place })
    byWeek.set(monday, entries)
  })

  const weeklyTop: R3WeeklyTop = {}
  for (const [monday, entries] of byWeek.entries()) {
    entries.sort((a, b) => a.place - b.place)
    const places = entries.map((entry) => entry.place)
    if (new Set(places).size !== places.length) {
      warnings.push(
        `Топ3 R3: за неделю (понедельник ${monday}) есть одинаковые места — порядок взят из таблицы`,
      )
    }
    if (entries.length !== 3) {
      warnings.push(`Топ3 R3: за неделю (понедельник ${monday}) записано игроков: ${entries.length} (ожидается 3)`)
    }
    const officers: Officer[] = entries.map((entry) => ({ name: entry.name, rank: 'R3' }))
    weeklyTop[monday] = officers
  }
  // Свежие недели сверху — для читабельного data.json
  const sorted: R3WeeklyTop = {}
  for (const monday of Object.keys(weeklyTop).sort((a, b) => (a < b ? 1 : -1))) {
    const officers = weeklyTop[monday]
    if (officers !== undefined) {
      sorted[monday] = officers
    }
  }
  return sorted
}
