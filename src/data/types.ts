// EXPORTS:
//   IApiSettings, IPromptHistoryItem, IPromptFavoriteItem, IPromptTemplate,
//   IOptimizeSession, ICompareSession, ProviderType, PromptMode,
//   MOCK_TEMPLATES, PROVIDER_MODELS, PROVIDER_CONFIGS, STORAGE_KEYS, DEFAULT_SETTINGS

export type ProviderType =
  | 'openai'
  | 'gemini'
  | 'deepseek'
  | 'zhipu'
  | 'siliconflow'
  | 'custom';

export type PromptMode = 'user' | 'system';

export interface IApiSettings {
  provider: ProviderType;
  apiKey: string;
  baseURL: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

export interface IPromptHistoryItem {
  id: string;
  mode: PromptMode;
  originalPrompt: string;
  optimizedPrompt: string;
  iteration: number;
  createdAt: number;
}

export interface IPromptFavoriteItem {
  id: string;
  title: string;
  content: string;
  mode: PromptMode;
  tags: string[];
  createdAt: number;
}

export interface IPromptTemplate {
  id: string;
  title: string;
  content: string;
  mode: PromptMode;
  source: 'builtin' | 'custom';
}

export interface IOptimizeSession {
  originalPrompt: string;
  optimizedPrompt: string;
  mode: PromptMode;
  iterations: { prompt: string; result: string }[];
  currentIteration: number;
}

export interface ICompareSession {
  originalPrompt: string;
  optimizedPrompt: string;
}

export const STORAGE_KEYS = {
  SETTINGS: '__app_promptopt_settings',
  HISTORY: '__app_promptopt_history',
  FAVORITES: '__app_promptopt_favorites',
  TEMPLATES: '__app_promptopt_templates',
  CURRENT_OPTIMIZE: '__app_promptopt_currentOptimize',
  CURRENT_COMPARE: '__app_promptopt_currentCompare',
};

export const DEFAULT_SETTINGS: IApiSettings = {
  provider: 'deepseek',
  apiKey: '',
  baseURL: 'https://api.deepseek.com/v1',
  model: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2048,
};

export const PROVIDER_CONFIGS: Record<
  ProviderType,
  { label: string; defaultBaseURL: string; defaultModel: string }
> = {
  openai: {
    label: 'OpenAI',
    defaultBaseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
  gemini: {
    label: 'Gemini',
    defaultBaseURL: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-2.0-flash',
  },
  deepseek: {
    label: 'DeepSeek',
    defaultBaseURL: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
  },
  zhipu: {
    label: '智谱 AI',
    defaultBaseURL: 'https://open.bigmodel.cn/api/paas/v4',
    defaultModel: 'glm-4-flash',
  },
  siliconflow: {
    label: '硅基流动',
    defaultBaseURL: 'https://api.siliconflow.cn/v1',
    defaultModel: 'Qwen/Qwen2.5-7B-Instruct',
  },
  custom: {
    label: '自定义 API',
    defaultBaseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
  },
};

export const PROVIDER_MODELS: Record<ProviderType, string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
  gemini: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-1.0-pro'],
  deepseek: ['deepseek-chat', 'deepseek-reasoner'],
  zhipu: ['glm-4-plus', 'glm-4', 'glm-4-flash', 'glm-4-air', 'glm-3-turbo'],
  siliconflow: [
    'Qwen/Qwen2.5-7B-Instruct',
    'Qwen/Qwen2.5-72B-Instruct',
    'deepseek-ai/DeepSeek-V3',
    'meta-llama/Llama-3.1-8B-Instruct',
    'THUDM/glm-4-9b-chat',
  ],
  custom: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'custom-model'],
};

export const MOCK_TEMPLATES = [
  {
    id: 'tpl-1',
    title: '通用写作助手',
    content:
      '你是一位专业的写作助手，请根据用户的需求提供高质量的写作内容。要求：\n1. 结构清晰，层次分明\n2. 语言简洁有力\n3. 符合目标读者的认知水平\n4. 如有必要，提供多个版本供选择',
    mode: 'system' as const,
    source: 'builtin' as const,
  },
  {
    id: 'tpl-2',
    title: '代码审查专家',
    content:
      '你是一位资深的代码审查专家。请审查以下代码，从以下维度给出建议：\n1. 代码可读性与命名规范\n2. 潜在的 bug 和边界情况\n3. 性能优化建议\n4. 安全性问题\n5. 重构建议',
    mode: 'system' as const,
    source: 'builtin' as const,
  },
  {
    id: 'tpl-3',
    title: '翻译专家',
    content:
      '你是一位专业翻译。请将用户输入的内容翻译为目标语言，要求：\n1. 保持原文语气和风格\n2. 专业术语准确\n3. 符合目标语言的表达习惯\n4. 如遇歧义，请标注说明',
    mode: 'system' as const,
    source: 'builtin' as const,
  },
  {
    id: 'tpl-4',
    title: '产品需求文档',
    content:
      '请帮我把以下想法整理成一份产品需求文档，包含：\n- 需求背景\n- 用户画像\n- 功能描述\n- 交互流程\n- 验收标准',
    mode: 'user' as const,
    source: 'builtin' as const,
  },
  {
    id: 'tpl-5',
    title: '学习计划表',
    content:
      '我想学习【主题】，请为我制定一个为期【时长】的学习计划，包括：\n- 阶段目标\n- 每周学习内容\n- 推荐资源\n- 检验方式',
    mode: 'user' as const,
    source: 'builtin' as const,
  },
];
