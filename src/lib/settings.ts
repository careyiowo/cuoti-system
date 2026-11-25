/**
 * EXPORTS:
 * IAiSettings{baseUrl,apiKey,model,solverModel}
 * DEFAULT_AI_SETTINGS
 * loadAiSettings(), saveAiSettings(s)
 */

const NS = 'cuoti-system';
const KEY = 'ai-settings';

export interface IAiSettings {
  baseUrl: string;
  apiKey: string;
  /** 看图的视觉模型，负责把图片认成结构化题目 */
  model: string;
  /** 不拍答案时用来解题的模型，纯文本就够，走同一个接口和 Key */
  solverModel: string;
}

export const DEFAULT_AI_SETTINGS: IAiSettings = {
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  apiKey: '',
  // 认题用视觉理解专精模型：处理版式、公式、卷面涂改比通用模型的视觉分支更稳
  model: 'qwen3-vl-plus',
  // 四科共用一个解题模型，选额度里代际最新的旗舰；数学专精模型不覆盖英语/政治/408
  solverModel: 'qwen4-max',
};

export function loadAiSettings(): IAiSettings {
  try {
    const raw = localStorage.getItem(`${NS}:${KEY}`);
    if (!raw) return { ...DEFAULT_AI_SETTINGS };
    const parsed = JSON.parse(raw) as Partial<IAiSettings>;
    return {
      baseUrl: parsed.baseUrl || DEFAULT_AI_SETTINGS.baseUrl,
      apiKey: parsed.apiKey || '',
      model: parsed.model || DEFAULT_AI_SETTINGS.model,
      solverModel: parsed.solverModel || DEFAULT_AI_SETTINGS.solverModel,
    };
  } catch {
    return { ...DEFAULT_AI_SETTINGS };
  }
}

export function saveAiSettings(settings: IAiSettings): void {
  try {
    localStorage.setItem(`${NS}:${KEY}`, JSON.stringify(settings));
  } catch {
    // 隐私模式下静默降级
  }
}
