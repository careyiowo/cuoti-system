/**
 * EXPORTS:
 * normalizeLatex(text)
 *
 * 统一模型输出的公式写法：
 * - 微分号的 d 常被包成 \mathbf{d} / \mathrm{d} / \text{d}，渲染成加粗正体，
 *   而教材里是斜体，这里一律还原成 "\,dx"；
 * - 顺手压掉多余空格。
 * 纯文本部分原样保留。
 */

const D_MACROS = [
  /\\math(?:bf|rm|it|normal|text|sf|tt)\s*\{\s*d\s*\}/g,
  /\\math(?:bf|rm|it|normal|text|sf|tt)\s+d(?![a-zA-Z])/g,
  /\{\s*\\rm\s+d\s*\}/g,
  /\\[bm]oldsymbol\s*\{\s*d\s*\}/g,
];

export function normalizeLatex(text: string): string {
  let out = text;
  for (const pattern of D_MACROS) out = out.replace(pattern, '\\,d');
  return out.replace(/[ \t]{2,}/g, ' ');
}
