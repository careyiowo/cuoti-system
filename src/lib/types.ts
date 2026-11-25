/**
 * EXPORTS:
 * IOption{label,text}
 * IQuestion{id,subject,chapterId,type,stem,options,answer,solution,imageIds,note,attempts,correct,lastResult,lastPracticedAt,createdAt,updatedAt}
 * IImageRecord{id,dataUrl,createdAt}
 * IResponse{answer,correct}
 * ISession{id,createdAt,finishedAt,questionIds,responses,scopeLabel}
 * QuestionType = 'choice' | 'blank' | 'essay'
 * Mastery = 'new' | 'reviewing' | 'mastered' | 'stuck'
 */

export type QuestionType = 'choice' | 'blank' | 'essay';

export type Mastery = 'new' | 'reviewing' | 'mastered' | 'stuck';

export interface IOption {
  label: string;
  text: string;
}

export interface IQuestion {
  id: string;
  subject: string;
  chapterId: string;
  type: QuestionType;
  stem: string;
  options: IOption[];
  answer: string;
  solution: string;
  imageIds: string[];
  note: string;
  /** 累计作答次数（含做对与做错） */
  attempts: number;
  /** 做对次数 */
  correct: number;
  /** 连续做对次数，做错即清零 */
  streak: number;
  /** 做错次数 */
  wrong: number;
  lastResult: 'correct' | 'wrong' | null;
  lastPracticedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface IImageRecord {
  id: string;
  dataUrl: string;
  createdAt: number;
}

export interface IResponse {
  answer: string;
  /** 客观题由系统判定；主观题由用户自评，未评为 null */
  correct: boolean | null;
}

export interface ISession {
  id: string;
  createdAt: number;
  finishedAt: number | null;
  questionIds: string[];
  responses: Record<string, IResponse>;
  /** 组卷条件的中文描述，用于结果页标题 */
  scopeLabel: string;
}
