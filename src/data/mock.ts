import type { Officer, R3WeeklyTop, TripRecord } from '@/types/train'

/** Журнал поездок, новые записи сверху */
export const mockTrips: TripRecord[] = [
  { name: 'Заря', date: '2026-11-20', rank: 'R4' },
  { name: 'Гром', date: '2026-11-19', rank: 'R3' },
  { name: 'Вольф', date: '2026-11-18', rank: 'R5' },
  { name: 'Тень', date: '2026-11-17', rank: 'R4' },
  { name: 'Мираж', date: '2026-11-16', rank: 'R3' },
  { name: 'Феникс', date: '2026-11-15', rank: 'R5' },
  { name: 'Оса', date: '2026-11-14', rank: 'R4' },
  { name: 'Стальной', date: '2026-11-13', rank: 'R3' },
  { name: 'Вихрь', date: '2026-11-12', rank: 'R5' },
  { name: 'Барс', date: '2026-11-11', rank: 'R4' },
  { name: 'Циклон', date: '2026-11-10', rank: 'R3' },
  { name: 'Юки', date: '2026-11-09', rank: 'R5' },
  { name: 'Рико', date: '2026-11-08', rank: 'R4' },
  { name: 'Шторм', date: '2026-11-07', rank: 'R3' },
  { name: 'Альфа', date: '2026-11-06', rank: 'R5' },
]

/** Список офицеров R4/R5 (порядок строк — для разрешения равенств) */
export const mockR4R5Officers: Officer[] = [
  { name: 'Заря', rank: 'R4' },
  { name: 'Вольф', rank: 'R5' },
  { name: 'Тень', rank: 'R4' },
  { name: 'Феникс', rank: 'R5' },
  { name: 'Оса', rank: 'R4' },
  { name: 'Вихрь', rank: 'R5' },
  { name: 'Барс', rank: 'R4' },
  { name: 'Юки', rank: 'R5' },
  { name: 'Рико', rank: 'R4' },
  { name: 'Альфа', rank: 'R5' },
]

/**
 * Топ-3 R3 на игровую неделю. Ключ — понедельник недели (ISO-дата).
 * Тройка недели управляет поездом на следующей неделе: на каждом R3-дне
 * — тот, кто дольше всех без поездки (при равенстве — по порядку в тройке).
 */
export const mockR3WeeklyTop: R3WeeklyTop = {
  '2026-11-16': [
    { name: 'Гром', rank: 'R3' },
    { name: 'Циклон', rank: 'R3' },
    { name: 'Рай', rank: 'R3' },
  ],
  '2026-11-09': [
    { name: 'Мираж', rank: 'R3' },
    { name: 'Гром', rank: 'R3' },
    { name: 'Стальной', rank: 'R3' },
  ],
  '2026-11-02': [
    { name: 'Стальной', rank: 'R3' },
    { name: 'Мираж', rank: 'R3' },
    { name: 'Шторм', rank: 'R3' },
  ],
  '2026-10-26': [
    { name: 'Циклон', rank: 'R3' },
    { name: 'Рай', rank: 'R3' },
    { name: 'Гром', rank: 'R3' },
  ],
}
