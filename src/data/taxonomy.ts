/**
 * EXPORTS:
 * IChapter{id,name}
 * ISubjectDef{key,name,short,chapters,tint}
 * SUBJECTS: ISubjectDef[]
 * QUESTION_TYPE_META: {key,name,short}[]
 * subjectByKey(key)
 * chapterById(id)
 * chaptersOf(key)
 */

import type { QuestionType } from '@/lib/types';

export interface IChapter {
  id: string;
  name: string;
}

export interface ISubjectDef {
  key: string;
  name: string;
  short: string;
  /** 学科色，仅用于小面积标识，取自主色的邻近色相 */
  tint: string;
  chapters: IChapter[];
}

export const SUBJECTS: ISubjectDef[] = [
  {
    key: 'math2',
    name: '数学二',
    short: '数二',
    tint: 'primary',
    chapters: [
      { id: 'math2-1', name: '函数、极限与连续' },
      { id: 'math2-2', name: '一元函数微分学' },
      { id: 'math2-3', name: '一元函数积分学' },
      { id: 'math2-4', name: '多元函数微分学' },
      { id: 'math2-5', name: '二重积分' },
      { id: 'math2-6', name: '常微分方程' },
      { id: 'math2-7', name: '行列式' },
      { id: 'math2-8', name: '矩阵' },
      { id: 'math2-9', name: '向量' },
      { id: 'math2-10', name: '线性方程组' },
      { id: 'math2-11', name: '特征值与特征向量' },
      { id: 'math2-12', name: '二次型' },
    ],
  },
  {
    key: 'english2',
    name: '英语二',
    short: '英二',
    tint: 'info',
    chapters: [
      { id: 'eng2-1', name: '完形填空' },
      { id: 'eng2-2', name: '阅读理解' },
      { id: 'eng2-3', name: '新题型' },
      { id: 'eng2-4', name: '翻译' },
      { id: 'eng2-5', name: '写作' },
      { id: 'eng2-6', name: '词汇与语法' },
    ],
  },
  {
    key: 'politics',
    name: '政治',
    short: '政治',
    tint: 'destructive',
    chapters: [
      { id: 'pol-1', name: '马克思主义基本原理' },
      { id: 'pol-2', name: '毛泽东思想与中国特色社会主义理论体系' },
      { id: 'pol-3', name: '中国近现代史纲要' },
      { id: 'pol-4', name: '思想道德与法治' },
      { id: 'pol-5', name: '形势与政策' },
    ],
  },
  {
    key: 'cs408',
    name: '408 计算机学科专业基础',
    short: '408',
    tint: 'chart-4',
    chapters: [
      { id: 'cs408-1', name: '数据结构' },
      { id: 'cs408-2', name: '计算机组成原理' },
      { id: 'cs408-3', name: '操作系统' },
      { id: 'cs408-4', name: '计算机网络' },
    ],
  },
];

export const QUESTION_TYPE_META: { key: QuestionType; name: string; short: string }[] = [
  { key: 'choice', name: '选择题', short: '选' },
  { key: 'blank', name: '填空题', short: '填' },
  { key: 'essay', name: '解答题', short: '答' },
];

export function subjectByKey(key: string): ISubjectDef | undefined {
  return SUBJECTS.find((s) => s.key === key);
}

export function chapterById(id: string): IChapter | undefined {
  for (const s of SUBJECTS) {
    const hit = s.chapters.find((c) => c.id === id);
    if (hit) return hit;
  }
  return undefined;
}

export function chaptersOf(key: string): IChapter[] {
  return subjectByKey(key)?.chapters ?? [];
}
