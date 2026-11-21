// Временная sanity-проверка алгоритма очереди (jiti грузит TS с алиасом @/)
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, {
  alias: { '@/': new URL('../src/', import.meta.url).pathname },
})

const { computeCurrentDriver } = await jiti.import('../src/utils/queue.ts')
const { currentGameDay, gameDaysAgo } = await jiti.import('../src/utils/gameDay.ts')
const { mockTrips, mockR4R5Officers, mockR3VsLeaders } = await jiti.import('../src/data/mock.ts')

const now = Date.parse('2026-11-21T15:51:00+03:00') // 21.11.2026 15:51 МСК

// --- Игровой день (старт 05:00 МСК) ---
assert.equal(currentGameDay(now), '2026-11-21', 'после 05:00 — текущий календарный день')
assert.equal(currentGameDay(Date.parse('2026-11-21T04:59:00+03:00')), '2026-11-20', 'до 05:00 — вчерашний игровой день')
assert.equal(currentGameDay(Date.parse('2026-11-21T05:00:00+03:00')), '2026-11-21', 'ровно в 05:00 — новый игровой день')

// --- Дней назад ---
assert.equal(gameDaysAgo('2026-11-21', now), 0, 'сегодня — 0')
assert.equal(gameDaysAgo('2026-11-20', now), 1, 'вчера — 1')
assert.equal(gameDaysAgo('2026-11-19', now), 2, 'позавчера — 2')
assert.equal(gameDaysAgo('2026-11-11', now), 10, '10 дней')
assert.equal(gameDaysAgo('не-дата', now), 0, 'битая дата — 0')

// --- Очередь: мок ---
// Последняя поездка: Заря (R4, 2026-11-20) → сегодня день R3 → лидер #1 по VS = Гром
let driver = computeCurrentDriver(mockTrips, mockR4R5Officers, mockR3VsLeaders)
assert.equal(driver?.name, 'Гром', 'мок: сегодня день R3, лидер #1 = Гром')
assert.equal(driver?.rank, 'R3')

// Последняя поездка R3 → день R4/R5; последний R4/R5 в журнале = Вольф (11-18) → следующий в ростере = Тень
const tripsR3Last = [{ name: 'Гром', date: '2026-11-20', rank: 'R3' }, ...mockTrips.slice(1)]
driver = computeCurrentDriver(tripsR3Last, mockR4R5Officers, mockR3VsLeaders)
assert.equal(driver?.name, 'Тень', 'день R4/R5: следующий после Вольфа = Тень')

// Циклическое замыкание: последний R4/R5 = Альфа (хвост ростера) → следующий = Заря (голова)
const tripsAlfaLast = [
  { name: 'Шторм', date: '2026-11-20', rank: 'R3' },
  { name: 'Альфа', date: '2026-11-19', rank: 'R5' },
]
driver = computeCurrentDriver(tripsAlfaLast, mockR4R5Officers, mockR3VsLeaders)
assert.equal(driver?.name, 'Заря', 'цикл: после хвоста ростера — голова')

// Пустой журнал → старт цикла: день R4/R5, голова ростера
driver = computeCurrentDriver([], mockR4R5Officers, mockR3VsLeaders)
assert.equal(driver?.name, 'Заря', 'пустой журнал → голова ростера')

// Пустой ростер при дне R4/R5 → null
driver = computeCurrentDriver(tripsR3Last, [], mockR3VsLeaders)
assert.equal(driver, null, 'пустой ростер → null')

// День R3, но нет данных VS → null
driver = computeCurrentDriver(mockTrips, mockR4R5Officers, [])
assert.equal(driver, null, 'нет рейтинга VS → null')

// Последний R4/R5-водитель отсутствует в ростере → старт с головы
driver = computeCurrentDriver(
  [
    { name: 'Гром', date: '2026-11-20', rank: 'R3' },
    { name: 'Некто', date: '2026-11-19', rank: 'R4' },
  ],
  mockR4R5Officers,
  mockR3VsLeaders,
)
assert.equal(driver?.name, 'Заря', 'водитель вне ростера → голова ростера')

// Порядок записей в журнале не важен
const shuffled = [...mockTrips].reverse()
driver = computeCurrentDriver(shuffled, mockR4R5Officers, mockR3VsLeaders)
assert.equal(driver?.name, 'Гром', 'журнал в любом порядке → тот же результат')

// --- Стор (Pinia) end-to-end ---
const { createPinia, setActivePinia } = await jiti.import('pinia')
const { useTrainQueueStore } = await jiti.import('../src/stores/trainQueue.ts')

setActivePinia(createPinia())
const store = useTrainQueueStore()
store.load(mockTrips, mockR4R5Officers, mockR3VsLeaders)

assert.equal(store.currentDriver?.name, 'Гром', 'стор: водитель = лидер VS #1')
assert.equal(store.currentDriver?.rank, 'R3')
assert.equal(store.lastTripDaysAgo, gameDaysAgo('2026-11-19'), 'стор: дни от последней поездки Грома')
assert.equal(store.lastTripOf('Гром')?.date, '2026-11-19', 'стор: последняя поездка Грома')
assert.equal(store.lastTripOf('Мираж')?.date, '2026-11-16', 'стор: последняя поездка Миража')
assert.equal(store.lastTripOf('Рай'), null, 'стор: Рай не ездил → null')
assert.equal(store.trips.length, mockTrips.length)
assert.equal(store.r4r5Roster.length, 10)
assert.equal(store.r3VsLeaders.length, 6)
const daysAgo = store.lastTripDaysAgo

// Пустые данные → водитель не определён, дней назад — null
store.load([], [], [])
assert.equal(store.currentDriver, null, 'стор: пустые данные → null')
assert.equal(store.lastTripDaysAgo, null)

console.log('OK: все проверки прошли')
console.log('Мок: сегодня', currentGameDay(now), '→ водитель Гром, дней назад:', daysAgo)
