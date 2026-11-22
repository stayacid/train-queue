import { MIN_DAYS_R3, MIN_DAYS_R4R5 } from '@/constants'
import type { Rank } from '@/types/train'

/**
 * Порог кулдауна (в игровых днях) для ранга:
 * R3 — `MIN_DAYS_R3`, R4/R5 — `MIN_DAYS_R4R5`.
 */
export function cooldownDaysFor(rank: Rank): number {
  return rank === 'R3' ? MIN_DAYS_R3 : MIN_DAYS_R4R5
}
