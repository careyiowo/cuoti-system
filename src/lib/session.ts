/**
 * EXPORTS:
 * shuffle(list)
 * createSession(picked, scopeLabel) -> ISession（已落库）
 */

import { newId } from '@/lib/draft';
import { saveSession } from '@/lib/db';
import type { IQuestion, ISession } from '@/lib/types';

export function shuffle<T>(list: T[]): T[] {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export async function createSession(picked: IQuestion[], scopeLabel: string): Promise<ISession> {
  const session: ISession = {
    id: newId(),
    createdAt: Date.now(),
    finishedAt: null,
    questionIds: picked.map((q) => q.id),
    responses: {},
    scopeLabel: `${scopeLabel} · ${picked.length} 题`,
  };
  await saveSession(session);
  return session;
}
