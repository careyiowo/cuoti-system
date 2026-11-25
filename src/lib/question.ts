/**
 * EXPORTS:
 * MASTERY_META{new,reviewing,mastered,stuck}
 * masteryOf(q)
 * normalizeAnswer(text)
 * checkAnswer(q, response) -> boolean|null
 * applyAttempt(q, correct, response?) -> IQuestion
 * summarize(questions) -> {total,new,reviewing,mastered,stuck,bySubject}
 * typeName(type)
 */

import { QUESTION_TYPE_META, subjectByKey } from '@/data/taxonomy';
import type { IQuestion, Mastery, QuestionType } from '@/lib/types';

export const MASTERY_META: Record<Mastery, { label: string; caption: string }> = {
  new: { label: '待第一遍', caption: '还没重做过' },
  reviewing: { label: '重做中', caption: '做过，但还没连对两次' },
  mastered: { label: '已掌握', caption: '连续两次做对' },
  stuck: { label: '反复错', caption: '错过两次以上，仍未连对' },
};

export function masteryOf(q: IQuestion): Mastery {
  if (q.streak >= 2) return 'mastered';
  if (q.wrong >= 2) return 'stuck';
  if (q.attempts > 0) return 'reviewing';
  return 'new';
}

export function typeName(type: QuestionType): string {
  return QUESTION_TYPE_META.find((t) => t.key === type)?.name ?? '题目';
}

export function normalizeAnswer(text: string): string {
  return text
    .replace(/[\s\u3000]/g, '')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/；/g, ';')
    .replace(/：/g, ':')
    .toUpperCase()
    .trim();
}

function choiceKey(text: string): string {
  return normalizeAnswer(text)
    .replace(/[^A-Z]/g, '')
    .split('')
    .sort()
    .join('');
}

/**
 * 客观题返回 true/false，主观题固定返回 null（由用户自评）。
 */
export function checkAnswer(q: IQuestion, response: string): boolean | null {
  if (q.type === 'essay') return null;
  if (!response.trim() || !q.answer.trim()) return q.type === 'choice' ? false : null;

  if (q.type === 'choice') {
    return choiceKey(response) === choiceKey(q.answer);
  }

  const alternatives = q.answer
    .split(/[;；]|或|\|/)
    .map((part) => normalizeAnswer(part))
    .filter(Boolean);
  if (alternatives.length === 0) return null;
  return alternatives.includes(normalizeAnswer(response));
}

export function applyAttempt(q: IQuestion, correct: boolean, response?: string): IQuestion {
  const now = Date.now();
  // 做错时把这次的答案记下来，做对后不清空：之后复盘还能看到“上次错在哪个选项上”。
  // 大题的文字答案没有比对价值，只对客观题记录。
  const wrongAnswer =
    correct || q.type === 'essay' ? (q.wrongAnswer ?? null) : (response ?? '').trim();
  return {
    ...q,
    attempts: q.attempts + 1,
    correct: q.correct + (correct ? 1 : 0),
    wrong: q.wrong + (correct ? 0 : 1),
    streak: correct ? q.streak + 1 : 0,
    lastResult: correct ? 'correct' : 'wrong',
    lastPracticedAt: now,
    wrongAnswer,
    updatedAt: now,
  };
}

export function summarize(questions: IQuestion[]) {
  const counts: Record<Mastery, number> = { new: 0, reviewing: 0, mastered: 0, stuck: 0 };
  const bySubject = new Map<string, number>();
  for (const q of questions) {
    counts[masteryOf(q)] += 1;
    bySubject.set(q.subject, (bySubject.get(q.subject) ?? 0) + 1);
  }
  return {
    total: questions.length,
    counts,
    bySubject: [...bySubject.entries()].map(([key, count]) => ({
      key,
      name: subjectByKey(key)?.name ?? key,
      short: subjectByKey(key)?.short ?? key,
      count,
    })),
  };
}
