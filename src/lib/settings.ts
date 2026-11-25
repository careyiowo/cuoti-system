/**
 * EXPORTS:
 * IAiSettings{baseUrl,apiKey,model}
 * DEFAULT_AI_SETTINGS
 * loadAiSettings(), saveAiSettings(s)
 */

const NS = 'cuoti-system';
const KEY = 'ai-settings';

export interface IAiSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export const DEFAULT_AI_SETTINGS: IAiSettings = {
  baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  apiKey: '',
  model: 'qwen3.8-27b',
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
