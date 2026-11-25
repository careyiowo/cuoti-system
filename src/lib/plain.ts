/**
 * EXPORTS:
 * latexToPlain(text)
 *
 * 把 LaTeX 压成一行可读纯文本，给列表摘要这类不适合渲染公式的地方用。
 * 只做符号替换，不做排版，够读就行。
 */

const SYMBOLS: [RegExp, string][] = [
  [/\\iiint/g, '∭'],
  [/\\iint/g, '∬'],
  [/\\int/g, '∫'],
  [/\\sum/g, 'Σ'],
  [/\\prod/g, 'Π'],
  [/\\infty/g, '∞'],
  [/\\partial/g, '∂'],
  [/\\nabla/g, '∇'],
  [/\\lambda/g, 'λ'],
  [/\\alpha/g, 'α'],
  [/\\beta/g, 'β'],
  [/\\gamma/g, 'γ'],
  [/\\delta/g, 'δ'],
  [/\\theta/g, 'θ'],
  [/\\mu/g, 'μ'],
  [/\\sigma/g, 'σ'],
  [/\\omega/g, 'ω'],
  [/\\phi/g, 'φ'],
  [/\\pi/g, 'π'],
  [/\\leq|\\le/g, '≤'],
  [/\\geq|\\ge/g, '≥'],
  [/\\neq|\\ne/g, '≠'],
  [/\\times/g, '×'],
  [/\\cdot/g, '·'],
  [/\\pm/g, '±'],
  [/\\div/g, '÷'],
  [/\\rightarrow|\\to/g, '→'],
  [/\\Rightarrow/g, '⇒'],
  [/\\approx/g, '≈'],
  [/\\left|\\right/g, ''],
  [/\\,|\\;|\\!|\\ /g, ''],
];

export function latexToPlain(input: string): string {
  let text = input.replace(/\$+/g, '');

  // \frac{a}{b} → (a)/(b)：循环几次，照顾里面还套着分式的写法
  for (let i = 0; i < 3; i += 1) {
    text = text.replace(
      /\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g,
      '($1)/($2)',
    );
  }
  text = text.replace(/\\sqrt\s*\{([^{}]*)\}/g, '√($1)');

  for (const [pattern, value] of SYMBOLS) text = text.replace(pattern, value);

  text = text
    .replace(/\^\{([^{}]*)\}/g, '^($1)')
    .replace(/_\{([^{}]*)\}/g, '_($1)')
    .replace(/[{}]/g, '')
    // 剩下的 \arctan、\lim 之类的命令名直接露出词本身
    .replace(/\\([a-zA-Z]+)\s?/g, '$1 ');

  return text.replace(/[ \t]{2,}/g, ' ').trim();
}
