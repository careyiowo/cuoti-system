/**
 * EXPORTS:
 * IRecognizedDraft{subject,chapterId,type,stem,options,answer,solution}
 * recognizeQuestion(imageDataUrls, settings) -> Promise<IRecognizedDraft>
 */

import { SUBJECTS } from '@/data/taxonomy';
import type { IAiSettings } from '@/lib/settings';
import type { IOption, QuestionType } from '@/lib/types';

export interface IRecognizedDraft {
  subject: string;
  chapterId: string;
  type: QuestionType;
  stem: string;
  options: IOption[];
  answer: string;
  solution: string;
}

const TAXONOMY_TEXT = SUBJECTS.map(
  (s) => `${s.name}（${s.key}）：${s.chapters.map((c) => `${c.name}（${c.id}）`).join('、')}`,
).join('\n');

function buildPrompt(): string {
  return `你是考研错题整理助手。请识别图片里的这道错题，并且只输出一个 JSON 对象，不要 markdown 代码块，不要任何解释文字。

可选的科目与章节（必须从下面选，chapterId、subject 用括号里的值）：
${TAXONOMY_TEXT}

输出的 JSON 字段：
- subject：科目 key
- chapterId：章节 id
- type：题型，只能是 choice（选择题）、blank（填空题）、essay（解答题）
- stem：题干原文，公式用纯文本写法（如 x^2、∫、lim）
- options：选择题的选项数组，每项 {"label":"A","text":"选项内容"}；不是选择题时给 []
- answer：标准答案。选择题只写字母（如 A 或 AB）；填空题写答案原文，多个答案用分号分隔；解答题写最终结论。图片里没有答案信息时给空字符串
- solution：完整解题步骤与解析。图片里没有时给空字符串

如果有多张图片，可能是题目页加答案页，请合起来识别同一道题。`;
}

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) throw new Error('模型没有返回 JSON');
  const raw = text.slice(start, end + 1);
  return JSON.parse(raw) as unknown;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function toDraft(raw: unknown): IRecognizedDraft {
  const data = (raw ?? {}) as Record<string, unknown>;
  const subjectKey = asString(data.subject);
  const subject = SUBJECTS.find((s) => s.key === subjectKey) ?? SUBJECTS[0];
  const chapterValue = asString(data.chapterId);
  const chapter =
    subject.chapters.find((c) => c.id === chapterValue) ??
    SUBJECTS.flatMap((s) => s.chapters).find((c) => c.id === chapterValue) ??
    subject.chapters[0];

  const typeValue = asString(data.type);
  const type: QuestionType = typeValue === 'choice' || typeValue === 'blank' || typeValue === 'essay'
    ? typeValue
    : 'essay';

  const options: IOption[] = Array.isArray(data.options)
    ? (data.options as unknown[]).map((item, index) => {
        const entry = (item ?? {}) as Record<string, unknown>;
        return {
          label: asString(entry.label, String.fromCharCode(65 + index)),
          text: asString(entry.text),
        };
      })
    : [];

  return {
    subject: subject.key,
    chapterId: chapter.id,
    type,
    stem: asString(data.stem),
    options,
    answer: asString(data.answer),
    solution: asString(data.solution),
  };
}

export async function recognizeQuestion(
  imageDataUrls: string[],
  settings: IAiSettings,
): Promise<IRecognizedDraft> {
  if (!settings.apiKey.trim()) throw new Error('还没有配置识别用的 API Key');
  if (imageDataUrls.length === 0) throw new Error('没有可识别的图片');

  const content = [
    ...imageDataUrls.map((url) => ({ type: 'image_url' as const, image_url: { url } })),
    { type: 'text' as const, text: buildPrompt() },
  ];

  const body = {
    model: settings.model,
    temperature: 0.1,
    messages: [{ role: 'user', content }],
    // Qwen 系列默认开启深度思考，输出预算会被思维链吃掉一大半。
    // 题目识别是确定性的抽取任务，关掉思考更快也更省额度；不认这个字段的厂商会忽略它。
    enable_thinking: false,
  };

  let response: Response;
  try {
    response = await fetch(settings.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${settings.apiKey}`,
      },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error('识别请求没发出去：可能是浏览器拦截了跨域请求，或网络不通。可以先手动填写');
  }

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`识别接口返回 ${response.status}：${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: unknown } }[];
  };
  const rawContent = payload.choices?.[0]?.message?.content;
  const text = typeof rawContent === 'string' ? rawContent : String(rawContent ?? '');
  return toDraft(extractJson(text));
}
