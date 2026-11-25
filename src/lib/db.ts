/**
 * EXPORTS:
 * listQuestions(), getQuestion(id), saveQuestion(q), deleteQuestion(id)
 * saveImage(dataUrl) -> id, getImage(id), getImages(ids), listAllImages(), putImageRecord(r)
 * listSessions(), getSession(id), saveSession(s), deleteSession(id)
 * countAll() -> {questions, images, sessions}
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { IImageRecord, IQuestion, ISession } from '@/lib/types';

interface CuotiSchema extends DBSchema {
  questions: {
    key: string;
    value: IQuestion;
    indexes: { 'by-created': number; 'by-subject': string };
  };
  images: { key: string; value: IImageRecord };
  sessions: {
    key: string;
    value: ISession;
    indexes: { 'by-created': number };
  };
}

let dbPromise: Promise<IDBPDatabase<CuotiSchema>> | null = null;

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<CuotiSchema>('cuoti-system', 1, {
      upgrade(db) {
        const questions = db.createObjectStore('questions', { keyPath: 'id' });
        questions.createIndex('by-created', 'createdAt');
        questions.createIndex('by-subject', 'subject');
        db.createObjectStore('images', { keyPath: 'id' });
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('by-created', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function listQuestions(): Promise<IQuestion[]> {
  const db = await getDb();
  const all = await db.getAll('questions');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getQuestion(id: string): Promise<IQuestion | undefined> {
  const db = await getDb();
  return db.get('questions', id);
}

export async function saveQuestion(question: IQuestion): Promise<void> {
  const db = await getDb();
  await db.put('questions', question);
}

export async function deleteQuestion(id: string): Promise<void> {
  const db = await getDb();
  const target = await db.get('questions', id);
  if (target) {
    const tx = db.transaction(['questions', 'images'], 'readwrite');
    await tx.objectStore('questions').delete(id);
    for (const imageId of target.imageIds) {
      await tx.objectStore('images').delete(imageId);
    }
    await tx.done;
  }
}

export async function saveImage(dataUrl: string): Promise<string> {
  const db = await getDb();
  const id = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const record: IImageRecord = { id, dataUrl, createdAt: Date.now() };
  await db.put('images', record);
  return id;
}

export async function getImage(id: string): Promise<IImageRecord | undefined> {
  const db = await getDb();
  return db.get('images', id);
}

export async function getImages(ids: string[]): Promise<IImageRecord[]> {
  const db = await getDb();
  const records: IImageRecord[] = [];
  for (const id of ids) {
    const hit = await db.get('images', id);
    if (hit) records.push(hit);
  }
  return records;
}

/** 备份用：一次性取出全部图片记录 */
export async function listAllImages(): Promise<IImageRecord[]> {
  const db = await getDb();
  return db.getAll('images');
}

/** 恢复用：按原 id 写回图片，避免 id 被重新生成导致题目引用对不上 */
export async function putImageRecord(record: IImageRecord): Promise<void> {
  const db = await getDb();
  await db.put('images', record);
}

export async function countAll(): Promise<{ questions: number; images: number; sessions: number }> {
  const db = await getDb();
  const [questions, images, sessions] = await Promise.all([
    db.count('questions'),
    db.count('images'),
    db.count('sessions'),
  ]);
  return { questions, images, sessions };
}

export async function listSessions(): Promise<ISession[]> {
  const db = await getDb();
  const all = await db.getAll('sessions');
  return all.sort((a, b) => b.createdAt - a.createdAt);
}

export async function getSession(id: string): Promise<ISession | undefined> {
  const db = await getDb();
  return db.get('sessions', id);
}

export async function saveSession(session: ISession): Promise<void> {
  const db = await getDb();
  await db.put('sessions', session);
}

export async function deleteSession(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('sessions', id);
}
