// Быстрая проверка алгоритма очереди (jiti: TS без сборки)
// Запуск: node scripts/sanity-check.mjs
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, {
  alias: { '@/': new URL('../src/', import.meta.url).pathname },
})

const { computeCurrentDriver } = await jiti.import('../src/utils/queue.ts')
const { currentGameDay, gameDaysAgo, gameWeekMonday } = await jiti.import('../src/utils/gameDay.ts')
const { mockTrips, mockR4R5Officers, mockR3WeeklyTop } = await jiti.import('../src/data/mock.ts')

// Фиксированная «текущая» дата: пятница 21.11.2026, 15:51 МСК
const now = Date.parse('2026-11-21T15:51:00+03:00')

// --- gameDay ---
assert.equal(currentGameDay(now), '2026-11-21')
assert.equal(currentGameDay(Date.parse('2026-11-21T04:59:00+03:00')), '2026-11-20', 'до 05:00 МСК — ещё вчера')
assert.equal(currentGameDay(Date.parse('2026-11-21T05:00:00+03:00')), '2026-11-21', 'с 05:00 МСК — сегодня')

// --- gameWeekMonday (игровая неделя начинается в понедельник 05:00 МСК) ---
assert.equal(gameWeekMonday('2026-11-21'), '2026-11-16')
assert.equal(gameWeekMonday('2026-11-16'), '2026-11-16', 'понедельник сам себе понедельник')
assert.equal(gameWeekMonday('2026-11-15'), '2026-11-09', 'воскресенье — неделя от 09.11')

// --- gameDaysAgo ---
assert.equal(gameDaysAgo('2026-11-21', now), 0)
assert.equal(gameDaysAgo('2026-11-20', now), 1)
assert.equal(gameDaysAgo('2026-11-07', now), 14)

// --- День R4/R5: очередь по списку, указатель после последнего водителя ---
// 11-21 (сб) — R3-день (последняя поездка 11-20 R3), 11-20 (пт) — R4/R5-день:
// последний водитель R4/R5 — Вольф (11-18, позиция 2) → следующий Тень
const tripsR3Last = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Вольф', date: '2026-11-18', rank: 'R5' },
  { name: 'Тень', date: '2026-11-17', rank: 'R4' },
]
let driver = computeCurrentDriver(tripsR3Last, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Тень', 'указатель после последнего водителя R4/R5')

// Последний в журнале — R5, день R4/R5 → следующий за ним в списке
const tripsAlfaLast = [
  { name: 'Шторм', date: '2026-11-20', rank: 'R3' },
  { name: 'Альфа', date: '2026-11-19', rank: 'R5' },
]
driver = computeCurrentDriver(tripsAlfaLast, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'Альфа — последняя в списке → по кругу первая')

// Пустой журнал → день R4/R5 → первый в списке
driver = computeCurrentDriver([], mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'пустой журнал → первый в списке')

// Пустой список R4/R5 → null
driver = computeCurrentDriver(tripsR3Last, [], mockR3WeeklyTop, now)
assert.equal(driver, null, 'пустой список R4/R5 → null')

// Водитель R4/R5 не найден в списке → указатель сбрасывается на первый
const tripsUnknownDriver = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Некто', date: '2026-11-19', rank: 'R4' },
]
driver = computeCurrentDriver(tripsUnknownDriver, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'неизвестный водитель → первый в списке')

// Мок-данные: 11-21 — R3-день, тройка прошлой недели (11-09) = [Мираж, Гром, Стальной],
// R3-поездки с 11-16 по 11-21: Мираж 11-16, Гром 11-19 → слот 2 → #3 Стальной.
// Все трое на кулдауне (8/5/2 дня) → назначенный (UI покажет предупреждение)
driver = computeCurrentDriver(mockTrips, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Стальной', 'мок: 2-й R3-день недели → #3 тройки прошлой недели')

// --- День R3: тройка прошлой недели по слоту ---
// 1-й R3-день недели → #1
const r3First = [{ name: 'Заря', date: '2026-11-23', rank: 'R4' }]
driver = computeCurrentDriver(r3First, mockR4R5Officers, mockR3WeeklyTop, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Гром', '1-й R3-день недели → #1 тройки прошлой недели')

// 2-й R3-день недели → #2
const r3Second = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-23', rank: 'R3' },
]
driver = computeCurrentDriver(r3Second, mockR4R5Officers, mockR3WeeklyTop, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Циклон', '2-й R3-день недели → #2')

// 3-й R3-день недели → #3
const r3Third = [
  { name: 'Заря', date: '2026-11-26', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-25', rank: 'R3' },
  { name: 'Гром', date: '2026-11-23', rank: 'R3' },
]
driver = computeCurrentDriver(r3Third, mockR4R5Officers, mockR3WeeklyTop, Date.parse('2026-11-27T12:00:00+03:00'))
assert.equal(driver?.name, 'Рай', '3-й R3-день недели → #3')

// 4-й R3-день недели → по кругу снова #1
const r3Fourth = [
  { name: 'Заря', date: '2026-11-28', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-27', rank: 'R3' },
  { name: 'Гром', date: '2026-11-25', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-23', rank: 'R3' },
]
const top3Fresh = {
  '2026-11-16': [
    { name: 'Шторм', rank: 'R3' },
    { name: 'Рай', rank: 'R3' },
    { name: 'Циклон', rank: 'R3' },
  ],
}
driver = computeCurrentDriver(r3Fourth, mockR4R5Officers, top3Fresh, Date.parse('2026-11-29T12:00:00+03:00'))
assert.equal(driver?.name, 'Шторм', '4-й R3-день недели → по кругу снова #1')

// Назначенный на кулдауне → следующий доступный из тройки
const r3Cooldown = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-23', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-22', rank: 'R3' }, // 3 дня до 11-25 → на кулдауне
]
driver = computeCurrentDriver(r3Cooldown, mockR4R5Officers, mockR3WeeklyTop, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Рай', 'назначенный на кулдауне → следующий доступный')

// Все трое на кулдауне → назначенный (UI покажет мягкое предупреждение)
const r3AllCooldown = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-23', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-22', rank: 'R3' },
  { name: 'Гром', date: '2026-11-21', rank: 'R3' },
  { name: 'Рай', date: '2026-11-20', rank: 'R3' },
]
driver = computeCurrentDriver(r3AllCooldown, mockR4R5Officers, mockR3WeeklyTop, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Циклон', 'все на кулдауне → назначенный')

// Нет записи за прошлую неделю → ближайшая предыдущая
const top3Sparse = {
  '2026-11-09': [
    { name: 'Гром', rank: 'R3' },
    { name: 'Мираж', rank: 'R3' },
    { name: 'Стальной', rank: 'R3' },
  ],
}
driver = computeCurrentDriver(r3First, mockR4R5Officers, top3Sparse, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Гром', 'нет записи за неделю → ближайшая предыдущая')

// Нет топ-3 вообще (52 недели назад) → null
driver = computeCurrentDriver(r3First, mockR4R5Officers, {}, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver, null, 'нет топ-3 → null')

// Перемешанный журнал → результат не зависит от порядка записей
const shuffled = [...mockTrips].reverse()
driver = computeCurrentDriver(shuffled, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Стальной', 'порядок записей журнала не важен')

// --- Стор (Pinia) — интеграционно ---
const { createPinia, setActivePinia } = await jiti.import('pinia')
const { useTrainQueueStore } = await jiti.import('../src/stores/trainQueue.ts')

setActivePinia(createPinia())
const store = useTrainQueueStore()
store.load(mockTrips, mockR4R5Officers, mockR3WeeklyTop)
assert.equal(store.currentDriver?.name, 'Стальной')
assert.equal(store.lastTripDaysAgo, gameDaysAgo('2026-11-13'), 'последняя поездка Стального — 11-13')
assert.equal(store.lastTripOf('Гром')?.date, '2026-11-19')
assert.equal(store.r3WeeklyTop['2026-11-09']?.length, 3)

store.load([], [], {})
assert.equal(store.currentDriver, null)
assert.equal(store.lastTripDaysAgo, null)

console.log('SANITY OK')
