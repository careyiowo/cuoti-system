/**
 * EXPORTS:
 * MathText({text, className})
 *
 * 错题文本里的公式渲染。两条路：
 * 1. 模型按约定输出的 $...$ / $$...$$ / \(...\) / \[...\]，按标记切；
 * 2. 老数据里的裸 LaTeX（如 \int_0^{+\infty} xe^{-x} dx），按中文边界切块后逐块尝试。
 * 任何一块渲染失败都退回原文，不会把界面搞成乱码。
 */

import { useMemo } from 'react';
import katex from 'katex';
import { cn } from '@/lib/utils';

interface MathTextProps {
  text: string;
  className?: string;
}

/** 中文与全角标点：用作切分边界，这些一律按普通文字输出 */
const CJK_RUN = /([\u3000-\u303f\u4e00-\u9fff\uff00-\uffef]+)/;

/** 带分隔符的公式片段 */
const DELIMITED = /(\$\$[\s\S]*?\$\$|\$[\s\S]*?\$|\\\([\s\S]*?\\\)|\\\[[\s\S]*?\\\])/;

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderMath(source: string): string | null {
  const trimmed = source.trim();
  if (!trimmed) return null;
  try {
    return katex.renderToString(trimmed, {
      throwOnError: true,
      displayMode: false,
      output: 'html',
    });
  } catch {
    return null;
  }
}

/** 出现反斜杠命令或上下标，才有必要时不时地当公式试一下 */
function looksLikeMath(chunk: string): boolean {
  return /[\\^_{}]/.test(chunk);
}

function inlineChunk(chunk: string): string {
  if (!chunk.trim()) return escapeHtml(chunk);
  if (!looksLikeMath(chunk)) return escapeHtml(chunk);
  const whole = renderMath(chunk);
  if (whole) return whole;
  // 整块失败时按空格拆开再试，能救回大部分只坏了一小段的公式
  return chunk
    .split(/(\s+)/)
    .map((piece) => {
      if (!piece.trim() || !looksLikeMath(piece)) return escapeHtml(piece);
      return renderMath(piece) ?? escapeHtml(piece);
    })
    .join('');
}

function lineToHtml(line: string): string {
  return line
    .split(DELIMITED)
    .map((part) => {
      if (!part) return '';
      if (part.startsWith('$$') && part.endsWith('$$')) {
        return renderMath(part.slice(2, -2)) ?? escapeHtml(part);
      }
      if (part.startsWith('$') && part.endsWith('$')) {
        return renderMath(part.slice(1, -1)) ?? escapeHtml(part);
      }
      if (part.startsWith('\\(') && part.endsWith('\\)')) {
        return renderMath(part.slice(2, -2)) ?? escapeHtml(part);
      }
      if (part.startsWith('\\[') && part.endsWith('\\]')) {
        return renderMath(part.slice(2, -2)) ?? escapeHtml(part);
      }
      return part
        .split(CJK_RUN)
        .map((piece, index) => (index % 2 === 1 ? escapeHtml(piece) : inlineChunk(piece)))
        .join('');
    })
    .join('');
}

function toHtml(text: string): string {
  return text.split('\n').map(lineToHtml).join('<br/>');
}

export default function MathText({ text, className }: MathTextProps) {
  const html = useMemo(() => toHtml(text), [text]);
  if (!text || !text.trim()) return null;
  return (
    <div
      className={cn('whitespace-pre-wrap leading-7', className)}
      // 公式必须交给 KaTeX 渲染，普通文字已逐段转义，不引入外部输入的执行能力
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
