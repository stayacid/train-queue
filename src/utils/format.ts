/** Форматирует ISO-дату (YYYY-MM-DD) в ДД.ММ.ГГГГ */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) {
    return isoDate
  }
  return `${day}.${month}.${year}`
}
