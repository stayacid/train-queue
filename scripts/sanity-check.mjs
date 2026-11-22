// Sanity-проверка алгоритма очереди (jiti грузит TS с алиасом @/)
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, {
  alias: { '@/': new URL('../src/', import.meta.url).pathname },
})

const { computeCurrentDriver } = await jiti.import('../src/utils/queue.ts')
const { currentGameDay, gameDaysAgo, gameWeekMonday } = await jiti.import('../src/utils/gameDay.ts')
const { mockTrips, mockR4R5Officers, mockR3VsLeaders, mockR3WeeklyTop } = await jiti.import('../src/data/mock.ts')

const now = Date.parse('2026-11-21T15:51:00+03:00') // 2026-11-21 15:51 МСК

// --- Игровой день (старт 05:00 МСК) ---
assert.equal(currentGameDay(now), '2026-11-21', 'после 05:00 — текущий календарный день')
assert.equal(currentGameDay(Date.parse('2026-11-21T04:59:00+03:00')), '2026-11-20', 'до 05:00 — вчерашний игровой день')
assert.equal(currentGameDay(Date.parse('2026-11-21T05:00:00+03:00')), '2026-11-21', 'ровно в 05:00 — новый игровой день')

// --- Игровая неделя (понедельник) ---
assert.equal(gameWeekMonday('2026-11-22'), '2026-11-16', 'воскресенье → понедельник недели')
assert.equal(gameWeekMonday('2026-11-16'), '2026-11-16', 'понедельник → сам')
assert.equal(gameWeekMonday('2026-11-17'), '2026-11-16', 'вторник → понедельник недели')

// --- Дней назад ---
assert.equal(gameDaysAgo('2026-11-20', now), 1, 'вчера = 1')
assert.equal(gameDaysAgo('2026-11-21', now), 0, 'сегодня = 0')
assert.equal(gameDaysAgo('2026-11-11', now), 10, '10 дней назад')

// --- R4/R5 очередь (логика без изменений) ---
// Последняя поездка R3 → сегодня день R4/R5; последний R4/R5 — Вольф (11-18) → следующий Тень
const tripsR3Last = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Вольф', date: '2026-11-18', rank: 'R5' },
  { name: 'Тень', date: '2026-11-17', rank: 'R4' },
]
let driver = computeCurrentDriver(tripsR3Last, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, now)
assert.equal(driver?.name, 'Тень', 'после Вольфа по ростеру — Тень')

// Последний R4/R5 — Альфа (конец ростера) → по кругу — Заря
const tripsAlfaLast = [
  { name: 'Шторм', date: '2026-11-20', rank: 'R3' },
  { name: 'Альфа', date: '2026-11-19', rank: 'R5' },
]
driver = computeCurrentDriver(tripsAlfaLast, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, now)
assert.equal(driver?.name, 'Заря', 'после Альфы по кругу — Заря')

// Пустой журнал → старт цикла: день R4/R5, голова ростера
driver = computeCurrentDriver([], mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, now)
assert.equal(driver?.name, 'Заря', 'пустой журнал → голова ростера')

// Пустой ростер R4/R5 → null
driver = computeCurrentDriver(tripsR3Last, [], mockR3WeeklyTop, mockR3VsLeaders, now)
assert.equal(driver, null, 'пустой ростер → null')

// Последний R4/R5-водитель отсутствует в ростере → очередь стартует с головы
const tripsUnknownDriver = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Некто', date: '2026-11-19', rank: 'R4' },
]
driver = computeCurrentDriver(tripsUnknownDriver, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, now)
assert.equal(driver?.name, 'Заря', 'водитель вне ростера → старт с головы')

// --- R3: топ-3 за прошлую игровую неделю ---
// Мок: сегодня 2026-11-21 (сб), день R3 (последняя поездка — R4, 11-20).
// Неделя 11-16..11-22: R3-поездки 11-16 и 11-19 → слот 2 → #3 тройки недели 11-09 = Стальной.
// Все трое на кулдауне (последние 11-13, 11-16, 11-19) → назначенный, Стальной.
driver = computeCurrentDriver(mockTrips, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, now)
assert.equal(driver?.name, 'Стальной', 'мок: слот 2 → #3; все на кулдауне → назначенный')

// 1-й R3-день недели → #1
const r3First = [{ name: 'Заря', date: '2026-11-23', rank: 'R4' }]
driver = computeCurrentDriver(r3First, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Гром', '1-й R3-день недели → #1 тройки прошлой недели')

// 2-й R3-день недели → #2
const r3Second = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-23', rank: 'R3' },
]
driver = computeCurrentDriver(r3Second, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Циклон', '2-й R3-день недели → #2')

// 3-й R3-день недели → #3
const r3Third = [
  { name: 'Заря', date: '2026-11-26', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-25', rank: 'R3' },
  { name: 'Гром', date: '2026-11-23', rank: 'R3' },
]
driver = computeCurrentDriver(r3Third, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, Date.parse('2026-11-27T12:00:00+03:00'))
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
driver = computeCurrentDriver(r3Fourth, mockR4R5Officers, top3Fresh, mockR3VsLeaders, Date.parse('2026-11-29T12:00:00+03:00'))
assert.equal(driver?.name, 'Шторм', '4-й R3-день недели → по кругу снова #1')

// Назначенный на кулдауне → следующий доступный из тройки
const r3Cooldown = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-23', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-22', rank: 'R3' }, // 3 дня до 11-25 → на кулдауне
]
driver = computeCurrentDriver(r3Cooldown, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Рай', 'назначенный на кулдауне → следующий доступный')

// Все трое на кулдауне → назначенный (UI покажет мягкое предупреждение)
const r3AllCooldown = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-23', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-22', rank: 'R3' },
  { name: 'Гром', date: '2026-11-21', rank: 'R3' },
  { name: 'Рай', date: '2026-11-20', rank: 'R3' },
]
driver = computeCurrentDriver(r3AllCooldown, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Циклон', 'все на кулдауне → назначенный')

// Нет записи за прошлую неделю → ближайшая предыдущая
const top3Sparse = {
  '2026-11-09': [
    { name: 'Гром', rank: 'R3' },
    { name: 'Мираж', rank: 'R3' },
    { name: 'Стальной', rank: 'R3' },
  ],
}
driver = computeCurrentDriver(r3First, mockR4R5Officers, top3Sparse, mockR3VsLeaders, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Гром', 'нет записи за неделю → ближайшая предыдущая')

// Нет топ-3 вообще → первые три из рейтинга VS
driver = computeCurrentDriver(r3First, mockR4R5Officers, {}, mockR3VsLeaders, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Гром', 'нет топ-3 → первый из рейтинга VS')

// День R3, нет ни топ-3, ни рейтинга VS → null
driver = computeCurrentDriver(r3First, mockR4R5Officers, {}, [], Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver, null, 'нет данных R3 → null')

// Перемешанный журнал → результат не зависит от порядка записей
const shuffled = [...mockTrips].reverse()
driver = computeCurrentDriver(shuffled, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders, now)
assert.equal(driver?.name, 'Стальной', 'порядок записей журнала не важен')

// --- Стор (Pinia) — интеграционно ---
const { createPinia, setActivePinia } = await jiti.import('pinia')
const { useTrainQueueStore } = await jiti.import('../src/stores/trainQueue.ts')
setActivePinia(createPinia())
const store = useTrainQueueStore()
// Актуально для недели мока 2026-11-16..2026-11-22: день R3, слот 2, все на кулдауне → Стальной
store.load(mockTrips, mockR4R5Officers, mockR3WeeklyTop, mockR3VsLeaders)
assert.equal(store.currentDriver?.name, 'Стальной', 'стор: день R3, слот 2, все на кулдауне → назначенный')
assert.equal(store.lastTripDaysAgo, gameDaysAgo('2026-11-13'), 'стор: дней с последней поездки Стального')
assert.equal(store.lastTripOf('Гром')?.date, '2026-11-19', 'стор: последняя поездка офицера')
assert.equal(store.r3WeeklyTop['2026-11-09']?.length, 3, 'стор: топ-3 недели загружен')

// Пустые данные → null
store.load([], [], {}, [])
assert.equal(store.currentDriver, null, 'стор: пустые данные → null')
assert.equal(store.lastTripDaysAgo, null, 'стор: без водителя → дней назад null')

console.log('SANITY OK')
