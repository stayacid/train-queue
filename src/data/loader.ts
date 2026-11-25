import { mockR4R5Officers, mockR3WeeklyTop, mockTrips } from '@/data/mock'
import type { TrainQueueStore } from '@/stores/trainQueue'
import type { Officer, R3WeeklyTop, TripRecord } from '@/types/train'
import { fetchTabCsv, parseSheets, TAB_JOURNAL, TAB_ROSTER, TAB_TOP3 } from '@/utils/sheets'

/**
 * Снимок данных таблицы (форма public/data.json).
 * fetchedAt — ISO-время UTC, когда данные были получены из таблицы.
 */
export interface Snapshot {
  fetchedAt: string
  journal: TripRecord[]
  r4r5: Officer[]
  weeklyTop: R3WeeklyTop
}

/** Откуда взяты данные: файл-снимок / таблица напрямую / мок */
export type DataSource = 'file' | 'live' | 'mock'

export interface LoadedData {
  source: DataSource
  fetchedAt: string | null
}

const RANKS: readonly string[] = ['R3', 'R4', 'R5']

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isOfficer(value: unknown): value is Officer {
  return (
    isRecord(value) &&
    typeof value.name === 'string' &&
    value.name !== '' &&
    typeof value.rank === 'string' &&
    RANKS.includes(value.rank)
  )
}

function isTrip(value: unknown): value is TripRecord {
  return (
    isRecord(value) &&
    typeof value.date === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value.date) &&
    isOfficer(value)
  )
}

/** Проверить форму снапшота; при повреждённых данных бросает Error */
export function parseSnapshot(value: unknown): Snapshot {
  if (!isRecord(value)) {
    throw new Error('Снимок данных повреждён: не является объектом')
  }
  if (typeof value.fetchedAt !== 'string' || value.fetchedAt === '') {
    throw new Error('Снимок данных повреждён: нет времени получения (fetchedAt)')
  }
  if (!Array.isArray(value.journal) || !value.journal.every(isTrip)) {
    throw new Error('Снимок данных повреждён: журнал поездок')
  }
  if (!Array.isArray(value.r4r5) || !value.r4r5.every(isOfficer)) {
    throw new Error('Снимок данных повреждён: список R4/R5')
  }
  if (!isRecord(value.weeklyTop)) {
    throw new Error('Снимок данных повреждён: тройка R3')
  }
  const weeklyTop: R3WeeklyTop = {}
  for (const [weekMonday, officers] of Object.entries(value.weeklyTop)) {
    if (!Array.isArray(officers) || !officers.every(isOfficer)) {
      throw new Error('Снимок данных повреждён: тройка R3')
    }
    weeklyTop[weekMonday] = officers
  }
  return {
    fetchedAt: value.fetchedAt,
    journal: value.journal,
    r4r5: value.r4r5,
    weeklyTop,
  }
}

/** URL снапшота, вложенного в сайт (public/data.json) */
function dataFileUrl(): string {
  return `${import.meta.env.BASE_URL}data.json?t=${Date.now()}`
}

/** Загрузить снапшот из public/data.json (снимок от GitHub Actions) */
export async function fetchSnapshotFile(): Promise<Snapshot> {
  const response = await fetch(dataFileUrl(), { cache: 'no-store' })
  if (!response.ok) {
    throw new Error(`Не удалось загрузить data.json: HTTP ${response.status}`)
  }
  return parseSnapshot(await response.json())
}

/** Убрать устаревший кеш из старых версий (локальное хранилище больше не используется) */
function cleanupLegacyCache(): void {
  if (typeof localStorage === 'undefined') {
    return
  }
  try {
    localStorage.removeItem('train-queue:snapshot')
  } catch {
    // Кеш недоступен — не критично
  }
}

/**
 * Начальная загрузка страницы: снапшот из public/data.json, если его нет — мок.
 */
export async function loadInitialData(store: TrainQueueStore): Promise<LoadedData> {
  cleanupLegacyCache()
  let fromFile: Snapshot | null = null
  try {
    fromFile = await fetchSnapshotFile()
  } catch {
    fromFile = null
  }
  if (fromFile !== null) {
    store.load(fromFile.journal, fromFile.r4r5, fromFile.weeklyTop)
    return { source: 'file', fetchedAt: fromFile.fetchedAt }
  }
  store.load(mockTrips, mockR4R5Officers, mockR3WeeklyTop)
  return { source: 'mock', fetchedAt: null }
}

/**
 * Кнопка «Обновить»: скачать три вкладки прямо из Google Sheets
 * (у публичной таблицы CORS разрешён) и пересчитать данные.
 * При ошибке бросает Error — текущие данные не трогаем.
 */
export async function refreshFromSheets(
  store: TrainQueueStore,
): Promise<{ snapshot: Snapshot; warnings: string[] }> {
  const [journalCsv, rosterCsv, top3Csv] = await Promise.all([
    fetchTabCsv(TAB_JOURNAL),
    fetchTabCsv(TAB_ROSTER),
    fetchTabCsv(TAB_TOP3),
  ])
  const parsed = parseSheets({ journal: journalCsv, roster: rosterCsv, top3: top3Csv })
  const snapshot: Snapshot = {
    fetchedAt: new Date().toISOString(),
    journal: parsed.journal,
    r4r5: parsed.roster,
    weeklyTop: parsed.weeklyTop,
  }
  store.load(snapshot.journal, snapshot.r4r5, snapshot.weeklyTop)
  return { snapshot, warnings: parsed.warnings }
}
