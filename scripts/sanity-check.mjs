// Быстрая проверка алгоритма очереди (jiti: TS без сборки)
// Запуск: node scripts/sanity-check.mjs
import assert from 'node:assert/strict'
import { createJiti } from 'jiti'

const jiti = createJiti(import.meta.url, {
  alias: { '@/': new URL('../src/', import.meta.url).pathname },
})

const { computeCurrentDriver } = await jiti.import('../src/utils/queue.ts')
const { currentGameDay, currentCalendarDay, gameDaysAgo, gameWeekMonday } =
  await jiti.import('../src/utils/gameDay.ts')
const { isoWeekNumber, isoWeekMondayIso } = await jiti.import('../src/utils/sheets.ts')
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

// --- currentCalendarDay ---
assert.equal(currentCalendarDay(now), '2026-11-21')
assert.equal(
  currentCalendarDay(Date.parse('2026-11-21T04:59:00+03:00')),
  '2026-11-21',
  'календарный день — без игрового сдвига',
)

// --- isoWeekNumber (ISO-номер недели даты) ---
assert.equal(isoWeekNumber('2026-11-16'), 47, 'понедельник недели 47')
assert.equal(isoWeekNumber('2026-11-09'), 46, 'понедельник недели 46')
assert.equal(isoWeekNumber('2026-01-01'), 1, 'четверг — 1-я неделя')
assert.equal(isoWeekNumber('2025-12-29'), 1, 'понедельник 1-й недели следующего года')
assert.equal(isoWeekNumber('not-a-date'), null, 'невалидная дата → null')
// Обратное преобразование: 2026 — 53 ISO-недели (год начинается в четверг)
for (let week = 1; week <= 53; week++) {
  assert.equal(isoWeekNumber(isoWeekMondayIso(week, 2026)), week, `round-trip недели ${week}`)
}

// --- День R4/R5: тот, кто дольше всех без поездки ---
// now = 11-21: последняя поездка до сегодня — Гром 11-20 R3 → день R4/R5.
// Вольф (3 дня) и Тень (4 дня) ездили; остальные — никогда → Заря (голова списка)
const tripsR3Last = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Вольф', date: '2026-11-18', rank: 'R5' },
  { name: 'Тень', date: '2026-11-17', rank: 'R4' },
]
let driver = computeCurrentDriver(tripsR3Last, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'никогда не ездил → в приоритете, равенство — по списку')

// Последний в журнале — R5, день R4/R5; ездил только Альфа (2 дня) → Заря
const tripsAlfaLast = [
  { name: 'Шторм', date: '2026-11-20', rank: 'R3' },
  { name: 'Альфа', date: '2026-11-19', rank: 'R5' },
]
driver = computeCurrentDriver(tripsAlfaLast, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'дольше всех без поездки')

// Пустой журнал → день R4/R5 → никто не ездил → голова списка
driver = computeCurrentDriver([], mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'пустой журнал → голова списка')

// Пустой список R4/R5 → null
driver = computeCurrentDriver(tripsR3Last, [], mockR3WeeklyTop, now)
assert.equal(driver, null, 'пустой список R4/R5 → null')

// День R4/R5, все ездили → тот, кто дольше всех без поездки (Альфа — 15 дней)
const tripsAllRidden = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Заря', date: '2026-11-19', rank: 'R4' },
  { name: 'Вольф', date: '2026-11-18', rank: 'R5' },
  { name: 'Тень', date: '2026-11-17', rank: 'R4' },
  { name: 'Феникс', date: '2026-11-16', rank: 'R5' },
  { name: 'Оса', date: '2026-11-15', rank: 'R4' },
  { name: 'Вихрь', date: '2026-11-14', rank: 'R5' },
  { name: 'Барс', date: '2026-11-13', rank: 'R4' },
  { name: 'Юки', date: '2026-11-12', rank: 'R5' },
  { name: 'Рико', date: '2026-11-11', rank: 'R4' },
  { name: 'Альфа', date: '2026-11-06', rank: 'R5' },
]
driver = computeCurrentDriver(tripsAllRidden, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Альфа', 'все ездили → дольше всех без поездки')

// Поездки R3 тоже входят в ожидание:
// Юки 17 дней (R5), Барс 16 дней (R4), Альфа 2 дня (R3) → Юки
const smallRoster = [
  { name: 'Альфа', rank: 'R5' },
  { name: 'Барс', rank: 'R4' },
  { name: 'Юки', rank: 'R5' },
]
const tripsR3Counts = [
  { name: 'Альфа', date: '2026-11-19', rank: 'R3' },
  { name: 'Барс', date: '2026-11-05', rank: 'R4' },
  { name: 'Юки', date: '2026-11-04', rank: 'R5' },
]
driver = computeCurrentDriver(tripsR3Counts, smallRoster, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Юки', 'поездки R3 тоже входят в ожидание')

// Равенство в днях → порядок в списке
const tripsTie = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Альфа', date: '2026-11-10', rank: 'R5' },
  { name: 'Барс', date: '2026-11-10', rank: 'R4' },
  { name: 'Юки', date: '2026-11-10', rank: 'R5' },
]
driver = computeCurrentDriver(tripsTie, smallRoster, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Альфа', 'равенство → порядок в списке')

// Поездка, которой нет в списке, не влияет на выбор (все никогда не ездили → голова)
const tripsUnknownDriver = [
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Некто', date: '2026-11-19', rank: 'R4' },
]
driver = computeCurrentDriver(tripsUnknownDriver, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'поездки вне списка не учитываются')

// Мок-данные: 11-21 — R3-день (последняя поездка Заря 11-20 R4),
// тройка прошлой недели (11-09) = [Мираж, Гром, Стальной]:
// ожидание 5/2/8 дней → Стальной (на кулдауне → предупреждение в UI)
driver = computeCurrentDriver(mockTrips, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Стальной', 'мок: дольше всех без поездки из тройки')

// --- День R3: из тройки прошлой недели — тот, кто дольше всех без поездки ---
// Никогда не ездил → в приоритете (Рай; Гром — 5 дней, Циклон — 14)
const r3First = [
  { name: 'Заря', date: '2026-11-23', rank: 'R4' },
  { name: 'Гром', date: '2026-11-19', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-10', rank: 'R3' },
]
driver = computeCurrentDriver(r3First, mockR4R5Officers, mockR3WeeklyTop, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Рай', 'никогда не ездил → в приоритете')

// Все трое ездили → дольше всех без поездки (Стальной 11 > Мираж 8 > Гром 5)
const trioAllRiddenTrips = [
  { name: 'Заря', date: '2026-11-23', rank: 'R4' },
  { name: 'Гром', date: '2026-11-19', rank: 'R3' },
  { name: 'Мираж', date: '2026-11-16', rank: 'R3' },
  { name: 'Стальной', date: '2026-11-13', rank: 'R3' },
]
const top3AllRidden = {
  '2026-11-16': [
    { name: 'Гром', rank: 'R3' },
    { name: 'Мираж', rank: 'R3' },
    { name: 'Стальной', rank: 'R3' },
  ],
}
driver = computeCurrentDriver(trioAllRiddenTrips, mockR4R5Officers, top3AllRidden, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Стальной', 'все ездили → дольше всех без поездки')

// Равенство в днях → порядок в тройке (Гром и Циклон — 5 дней, Мираж — 3)
const top3Tie = {
  '2026-11-16': [
    { name: 'Гром', rank: 'R3' },
    { name: 'Циклон', rank: 'R3' },
    { name: 'Мираж', rank: 'R3' },
  ],
}
const r3TieTrips = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-22', rank: 'R3' },
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-20', rank: 'R3' },
]
driver = computeCurrentDriver(r3TieTrips, mockR4R5Officers, top3Tie, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Гром', 'равенство → порядок в тройке')

// Все на кулдауне → дольше всех без поездки (мягкое предупреждение в UI)
const r3AllCooldown = [
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-23', rank: 'R3' },
  { name: 'Циклон', date: '2026-11-22', rank: 'R3' },
  { name: 'Гром', date: '2026-11-21', rank: 'R3' },
  { name: 'Рай', date: '2026-11-20', rank: 'R3' },
]
driver = computeCurrentDriver(r3AllCooldown, mockR4R5Officers, mockR3WeeklyTop, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Рай', 'все на кулдауне → дольше всех без поездки (предупреждение в UI)')

// Поездка сегодняшнего дня входит в ожидание:
// Циклон ездил сегодня (0 дней), Гром — 6 дней → Гром
const top3Pair = {
  '2026-11-16': [
    { name: 'Гром', rank: 'R3' },
    { name: 'Циклон', rank: 'R3' },
  ],
}
const r3TodayWait = [
  { name: 'Циклон', date: '2026-11-25', rank: 'R3' },
  { name: 'Заря', date: '2026-11-24', rank: 'R4' },
  { name: 'Гром', date: '2026-11-19', rank: 'R3' },
]
driver = computeCurrentDriver(r3TodayWait, mockR4R5Officers, top3Pair, Date.parse('2026-11-25T12:00:00+03:00'))
assert.equal(driver?.name, 'Гром', 'поездка сегодняшнего дня входит в ожидание')

// Нет записи за прошлую неделю → ближайшая предыдущая
const top3Sparse = {
  '2026-11-09': [
    { name: 'Гром', rank: 'R3' },
    { name: 'Мираж', rank: 'R3' },
    { name: 'Стальной', rank: 'R3' },
  ],
}
driver = computeCurrentDriver(trioAllRiddenTrips, mockR4R5Officers, top3Sparse, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver?.name, 'Стальной', 'нет записи за неделю → ближайшая предыдущая')

// Нет топ-3 вообще (52 недели назад) → null
driver = computeCurrentDriver(r3First, mockR4R5Officers, {}, Date.parse('2026-11-24T12:00:00+03:00'))
assert.equal(driver, null, 'нет топ-3 → null')

// Перемешанный журнал → результат не зависит от порядка записей
const shuffled = [...mockTrips].reverse()
driver = computeCurrentDriver(shuffled, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Стальной', 'порядок записей журнала не важен')

// --- Поездка сегодняшнего дня не меняет фазу (это результат дня) ---
// now = 11-21: последняя поездка до сегодня — Гром 11-20 R3 → день R4/R5.
// Добавляем поездку сегодняшнего дня (11-21, R4) — назначение не меняется.
const tripsWithToday = [
  { name: 'Мираж', date: '2026-11-21', rank: 'R4' },
  { name: 'Гром', date: '2026-11-20', rank: 'R3' },
  { name: 'Вольф', date: '2026-11-18', rank: 'R5' },
  { name: 'Тень', date: '2026-11-17', rank: 'R4' },
]
driver = computeCurrentDriver(tripsWithToday, mockR4R5Officers, mockR3WeeklyTop, now)
assert.equal(driver?.name, 'Заря', 'поездка сегодняшнего дня не меняет назначение')

// --- Стор (Pinia) — интеграционно ---
const { createPinia, setActivePinia } = await jiti.import('pinia')
const { useTrainQueueStore } = await jiti.import('../src/stores/trainQueue.ts')

setActivePinia(createPinia())
const store = useTrainQueueStore()
store.load(mockTrips, mockR4R5Officers, mockR3WeeklyTop)
// Стор использует реальный Date.now() — водитель зависит от текущей недели,
// поэтому имя не хардкодим: сравниваем с чистой функцией на том же now.
const expectedDriver = computeCurrentDriver(mockTrips, mockR4R5Officers, mockR3WeeklyTop)
assert.deepEqual(store.currentDriver, expectedDriver, 'стор = чистая функция')
if (expectedDriver === null) {
  assert.equal(store.lastTripDaysAgo, null)
} else {
  const lastTrip = mockTrips.find((trip) => trip.name === expectedDriver.name)
  assert.equal(
    store.lastTripDaysAgo,
    lastTrip === undefined ? null : gameDaysAgo(lastTrip.date),
    'дней с последней поездки текущего водителя',
  )
}
assert.equal(store.lastTripOf('Гром')?.date, '2026-11-19')
assert.equal(store.r3WeeklyTop['2026-11-09']?.length, 3)

// todayTrip — запись журнала на текущий игровой день
const realToday = currentGameDay()
store.load(
  [{ name: 'Мираж', date: realToday, rank: 'R4' }, ...mockTrips],
  mockR4R5Officers,
  mockR3WeeklyTop,
)
assert.equal(store.todayTrip?.name, 'Мираж', 'todayTrip — поездка текущего игрового дня')

store.load([], [], {})
assert.equal(store.currentDriver, null)
assert.equal(store.lastTripDaysAgo, null)
assert.equal(store.todayTrip, null)

console.log('SANITY OK')
