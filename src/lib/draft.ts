/**
 * EXPORTS:
 * IQuestionDraft{subject,chapterId,type,stem,options,answer,solution,note}
 * emptyDraft(), draftFromQuestion(q), questionFromDraft(draft, base?), newId()
 */

import { SUBJECTS } from '@/data/taxonomy';
import type { IOption, IQuestion, QuestionType } from '@/lib/types';

export interface IQuestionDraft {
  subject: string;
  chapterId: string;
  type: QuestionType;
  stem: string;
  options: IOption[];
  answer: string;
  /** 上次错选（填）的答案，只在整理错题时手工补录用 */
  wrongAnswer: string;
  solution: string;
  note: string;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function emptyDraft(): IQuestionDraft {
  const first = SUBJECTS[0];
  return {
    subject: first.key,
    chapterId: first.chapters[0].id,
    type: 'choice',
    stem: '',
    options: [
      { label: 'A', text: '' },
      { label: 'B', text: '' },
      { label: 'C', text: '' },
      { label: 'D', text: '' },
    ],
    answer: '',
    wrongAnswer: '',
    solution: '',
    note: '',
  };
}

export function draftFromQuestion(q: IQuestion): IQuestionDraft {
  return {
    subject: q.subject,
    chapterId: q.chapterId,
    type: q.type,
    stem: q.stem,
    options: q.options.map((o) => ({ ...o })),
    answer: q.answer,
    wrongAnswer: q.wrongAnswer ?? '',
    solution: q.solution,
    note: q.note,
  };
}

export function questionFromDraft(draft: IQuestionDraft, base?: IQuestion): IQuestion {
  const now = Date.now();
  return {
    id: base?.id ?? newId(),
    subject: draft.subject,
    chapterId: draft.chapterId,
    type: draft.type,
    stem: draft.stem,
    options: draft.type === 'choice' ? draft.options : [],
    answer: draft.answer,
    solution: draft.solution,
    imageIds: base?.imageIds ?? [],
    note: draft.note,
    attempts: base?.attempts ?? 0,
    correct: base?.correct ?? 0,
    streak: base?.streak ?? 0,
    wrong: base?.wrong ?? 0,
    lastResult: base?.lastResult ?? null,
    lastPracticedAt: base?.lastPracticedAt ?? null,
    solutionSource: base?.solutionSource ?? null,
    wrongAnswer: draft.wrongAnswer.trim() || null,
    createdAt: base?.createdAt ?? now,
    updatedAt: now,
  };
}
