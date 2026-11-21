/** Форматирует ISO-дату (YYYY-MM-DD) в ДД.ММ.ГГГГ */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) {
    return isoDate
  }
  return `${day}.${month}.${year}`
}

/** Целое число полных дней между ISO-датой (YYYY-MM-DD) и сегодня */
export function daysAgo(isoDate: string): number {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) {
    return 0
  }
  const then = new Date(year, month - 1, day)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((startOfToday.getTime() - then.getTime()) / 86_400_000)
}

/** Русская плюрализация слова «день»: 1 день, 2 дня, 5 дней */
export function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) {
    return 'день'
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return 'дня'
  }
  return 'дней'
}
