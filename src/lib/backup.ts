/**
 * EXPORTS:
 * BACKUP_APP, BACKUP_VERSION
 * IBackupFile, IImportResult
 * buildBackup(includeImages) -> IBackupFile
 * backupFileName(now?) -> string
 * downloadJsonText(text, filename)
 * importBackupText(text) -> IImportResult
 * formatBytes(n)
 */

import {
  listAllImages,
  listQuestions,
  listSessions,
  putImageRecord,
  saveQuestion,
  saveSession,
} from '@/lib/db';
import type { IImageRecord, IQuestion, ISession } from '@/lib/types';

export const BACKUP_APP = 'cuoti-system';
export const BACKUP_VERSION = 1;

export interface IBackupFile {
  app: string;
  version: number;
  exportedAt: number;
  /** 是否包含图片数据；不含图片时题目里的 imageIds 会留空 */
  withImages: boolean;
  questions: IQuestion[];
  images: IImageRecord[];
  sessions: ISession[];
}

export interface IImportResult {
  addedQuestions: number;
  addedImages: number;
  addedSessions: number;
  skippedQuestions: number;
}

export async function buildBackup(includeImages: boolean): Promise<IBackupFile> {
  const [questions, sessions, images] = await Promise.all([
    listQuestions(),
    listSessions(),
    includeImages ? listAllImages() : Promise.resolve([] as IImageRecord[]),
  ]);
  return {
    app: BACKUP_APP,
    version: BACKUP_VERSION,
    exportedAt: Date.now(),
    withImages: includeImages,
    questions,
    images,
    sessions,
  };
}

export function backupFileName(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `cuoti-backup-${y}-${m}-${d}.json`;
}

export function downloadJsonText(text: string, filename: string): void {
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * 只往回合并，不覆盖已有题目：同 id 的记录跳过，避免把刚改过的题冲掉。
 */
export async function importBackupText(text: string): Promise<IImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('这个文件不是有效的 JSON，可能选错了文件');
  }

  const file = parsed as Partial<IBackupFile>;
  if (!file || file.app !== BACKUP_APP || !Array.isArray(file.questions)) {
    throw new Error('不是错题系统导出的备份文件');
  }
  if (typeof file.version === 'number' && file.version > BACKUP_VERSION) {
    throw new Error(`备份来自更新的版本（v${file.version}），当前系统读取不了`);
  }

  const existing = await listQuestions();
  const existingQuestionIds = new Set(existing.map((q) => q.id));
  const existingImageIds = new Set((await listAllImages()).map((i) => i.id));
  const existingSessionIds = new Set((await listSessions()).map((s) => s.id));

  const result: IImportResult = {
    addedQuestions: 0,
    addedImages: 0,
    addedSessions: 0,
    skippedQuestions: 0,
  };

  for (const question of file.questions) {
    if (!question || typeof question.id !== 'string') continue;
    if (existingQuestionIds.has(question.id)) {
      result.skippedQuestions += 1;
      continue;
    }
    await saveQuestion(question);
    existingQuestionIds.add(question.id);
    result.addedQuestions += 1;
  }

  for (const image of file.images ?? []) {
    if (!image || typeof image.id !== 'string' || !image.dataUrl) continue;
    if (existingImageIds.has(image.id)) continue;
    await putImageRecord(image);
    existingImageIds.add(image.id);
    result.addedImages += 1;
  }

  for (const session of file.sessions ?? []) {
    if (!session || typeof session.id !== 'string') continue;
    if (existingSessionIds.has(session.id)) continue;
    await saveSession(session);
    existingSessionIds.add(session.id);
    result.addedSessions += 1;
  }

  return result;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
