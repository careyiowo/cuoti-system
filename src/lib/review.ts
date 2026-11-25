/**
 * EXPORTS:
 * DAY_MS
 * REVIEW_INTERVALS
 * nextDueAt(q) -> number|null
 * isDue(q, now?)
 * dueList(list, now?) -> IQuestion[]
 * dueDelayLabel(q, now?) -> string  「今天该做」「已拖了 3 天」…
 */

import type { IQuestion } from '@/lib/types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 间隔按「连续做对次数」取值：上次做错就隔 1 天回来，连对越多间隔越长。
 * 这是简化版艾宾浩斯：错题优先、简单的会自然淡出。
 */
export const REVIEW_INTERVALS = [1, 2, 4, 7, 15, 30];

export function nextDueAt(q: IQuestion): number | null {
  if (q.attempts === 0 || q.lastPracticedAt == null) return null;
  const index = Math.min(Math.max(q.streak, 0), REVIEW_INTERVALS.length - 1);
  return q.lastPracticedAt + REVIEW_INTERVALS[index] * DAY_MS;
}

export function isDue(q: IQuestion, now = Date.now()): boolean {
  const due = nextDueAt(q);
  return due !== null && due <= now;
}

/** 到期的题，越早该做越靠前 */
export function dueList(list: IQuestion[], now = Date.now()): IQuestion[] {
  return list
    .filter((q) => isDue(q, now))
    .sort((a, b) => (nextDueAt(a) ?? 0) - (nextDueAt(b) ?? 0));
}

export function dueDelayLabel(q: IQuestion, now = Date.now()): string {
  const due = nextDueAt(q);
  if (due === null) return '还没做过';
  const diff = now - due;
  if (diff <= 0) return '还没到期';
  const days = Math.floor(diff / DAY_MS);
  if (days === 0) return '今天该做';
  return `已拖了 ${days} 天`;
}
