/** Форматирует ISO-дату (YYYY-MM-DD) в ДД.ММ.ГГГГ */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) {
    return isoDate
  }
  return `${day}.${month}.${year}`
}

/** Форматирует ISO-время (UTC) в ДД.ММ.ГГГГ ЧЧ:ММ в локальной часовой зоне браузера */
export function formatDateTime(isoDateTime: string): string {
  const date = new Date(isoDateTime)
  if (Number.isNaN(date.getTime())) {
    return isoDateTime
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
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
