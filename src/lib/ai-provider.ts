import type { IApiSettings, PromptMode } from '@/data/types';

export interface StreamCallbacks {
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: AiError) => void;
}

export interface AiError {
  type: 'auth' | 'network' | 'cors' | 'rate_limit' | 'unknown';
  message: string;
  suggestion: string;
}

// 优化提示词的 System Prompt（用户提示词模式）
const USER_PROMPT_OPTIMIZE_SYSTEM = `你是一位专业的提示词优化专家，擅长将用户随手写的简单提示词，优化为结构完整、逻辑清晰、效果显著的高质量提示词。

请对用户输入的提示词进行优化，遵循以下原则：
1. **明确角色与背景**：为 AI 设定清晰的专业角色和任务背景
2. **结构化输出**：将任务要求分解为清晰的步骤或维度
3. **约束与边界**：明确哪些该做、哪些不该做
4. **输出格式**：指定输出的格式（markdown / 列表 / JSON 等）
5. **示例引导**：必要时加入示例说明预期效果
6. **语言保持**：优化后的提示词语言与原始提示词保持一致

请直接输出优化后的完整提示词，不要加任何解释、前缀或后缀。`;

// 优化提示词的 System Prompt（系统提示词模式）
const SYSTEM_PROMPT_OPTIMIZE_SYSTEM = `你是一位专业的 AI 系统提示词设计专家，擅长设计高质量的 System Prompt，用于定义 AI 的角色、行为规范和输出标准。

请对用户输入的系统提示词进行优化，遵循以下原则：
1. **角色定义清晰**：明确 AI 的身份、专业领域、能力范围
2. **行为准则具体**：列出 AI 应遵循的操作规范和思考方式
3. **输出标准明确**：定义输出的质量要求、格式规范、语气风格
4. **边界约束严谨**：明确 AI 不应做的事情和拒绝方式
5. **思维链引导**：必要时加入推理步骤要求
6. **语言保持**：优化后的提示词语言与原始提示词保持一致

请直接输出优化后的完整系统提示词，不要加任何解释、前缀或后缀。`;

export function getOptimizeSystemPrompt(mode: PromptMode): string {
  return mode === 'user' ? USER_PROMPT_OPTIMIZE_SYSTEM : SYSTEM_PROMPT_OPTIMIZE_SYSTEM;
}

// 迭代优化的 System Prompt
const ITERATE_OPTIMIZE_SYSTEM = `你是一位专业的提示词迭代优化专家。请根据用户的要求，对上一轮的提示词进行进一步改进和优化，使其效果更好、更精准。

请直接输出改进后的完整提示词，不要加任何解释、前缀或后缀。`;

export function getIterateSystemPrompt(): string {
  return ITERATE_OPTIMIZE_SYSTEM;
}

/**
 * 调用 AI 聊天接口（流式）
 * 使用 OpenAI 兼容格式：POST {baseURL}/chat/completions
 * Gemini 走不同的格式
 */
export async function streamChat(
  settings: IApiSettings,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
): Promise<void> {
  const { provider, apiKey, baseURL, model, temperature, maxTokens } = settings;

  try {
    if (provider === 'gemini') {
      await streamChatGemini(settings, messages, callbacks);
      return;
    }

    // OpenAI 兼容格式
    const url = `${baseURL.replace(/\/$/, '')}/chat/completions`;
    const body = {
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: true,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await parseErrorResponse(response);
      callbacks.onError(err);
      return;
    }

    if (!response.body) {
      callbacks.onError({
        type: 'network',
        message: '响应体为空',
        suggestion: '请检查网络连接后重试',
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        try {
          const data = JSON.parse(dataStr);
          const delta = data.choices?.[0]?.delta?.content;
          if (delta) {
            callbacks.onDelta(delta);
          }
        } catch {
          // ignore parse error for single chunk
        }
      }
    }

    callbacks.onDone();
  } catch (err) {
    const aiErr = classifyError(err);
    callbacks.onError(aiErr);
  }
}

async function streamChatGemini(
  settings: IApiSettings,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  callbacks: StreamCallbacks,
): Promise<void> {
  const { apiKey, baseURL, model, temperature, maxTokens } = settings;
  const url = `${baseURL.replace(/\/$/, '')}/models/${model}:streamGenerateContent?key=${encodeURIComponent(apiKey)}&alt=sse`;

  // Gemini 格式：system_instruction + contents
  const systemMsg = messages.find((m) => m.role === 'system');
  const chatMessages = messages.filter((m) => m.role !== 'system').map((m) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const body: Record<string, unknown> = {
    contents: chatMessages,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };
  if (systemMsg) {
    body.system_instruction = {
      parts: [{ text: systemMsg.content }],
    };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await parseErrorResponse(response);
      callbacks.onError(err);
      return;
    }

    if (!response.body) {
      callbacks.onError({
        type: 'network',
        message: '响应体为空',
        suggestion: '请检查网络连接后重试',
      });
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        if (!trimmed.startsWith('data:')) continue;

        const dataStr = trimmed.slice(5).trim();
        try {
          const data = JSON.parse(dataStr);
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            callbacks.onDelta(text);
          }
        } catch {
          // ignore
        }
      }
    }

    callbacks.onDone();
  } catch (err) {
    callbacks.onError(classifyError(err));
  }
}

async function parseErrorResponse(response: Response): Promise<AiError> {
  let bodyText = '';
  try {
    bodyText = await response.text();
  } catch {
    // ignore
  }

  if (response.status === 401 || response.status === 403) {
    return {
      type: 'auth',
      message: 'API Key 无效或权限不足',
      suggestion: '请检查 API Key 是否正确，或前往设置页重新配置',
    };
  }
  if (response.status === 429) {
    return {
      type: 'rate_limit',
      message: '请求过于频繁，已触发速率限制',
      suggestion: '请稍后重试，或检查 API 配额是否充足',
    };
  }
  if (response.status === 400) {
    let detail = '请求参数错误';
    try {
      const j = JSON.parse(bodyText);
      if (j.error?.message) detail = j.error.message;
    } catch {
      /* empty */
    }
    return {
      type: 'unknown',
      message: detail,
      suggestion: '请检查模型名称和参数配置是否正确',
    };
  }
  if (response.status >= 500) {
    return {
      type: 'network',
      message: `服务商服务器错误 (${response.status})`,
      suggestion: '请稍后重试，或切换其他服务商',
    };
  }
  return {
    type: 'unknown',
    message: `请求失败 (${response.status})`,
    suggestion: '请检查网络和配置后重试',
  };
}

function classifyError(err: unknown): AiError {
  const msg = err instanceof Error ? err.message : String(err);

  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('network')
  ) {
    // 浏览器 CORS 或网络问题
    return {
      type: 'cors',
      message: '无法连接到 API 服务器（可能是 CORS 或网络问题）',
      suggestion:
        '1. 检查网络连接是否正常\n2. 部分服务商（如 OpenAI 官方）浏览器直连可能受 CORS 限制，建议使用支持 CORS 的中转服务或本地代理\n3. 尝试切换其他服务商（如 DeepSeek、硅基流动等支持 CORS）',
    };
  }
  if (msg.includes('timeout') || msg.includes('Timeout')) {
    return {
      type: 'network',
      message: '请求超时',
      suggestion: '请检查网络连接，或稍后重试',
    };
  }
  return {
    type: 'unknown',
    message: msg || '未知错误',
    suggestion: '请检查配置后重试',
  };
}

/**
 * 测试 API 连接（非流式，只发一条短消息看是否成功）
 */
export async function testConnection(settings: IApiSettings): Promise<{ ok: boolean; error?: AiError }> {
  return new Promise((resolve) => {
    streamChat(
      settings,
      [{ role: 'user', content: 'hi' }],
      {
        onDelta: () => {
          // 收到第一个 delta 就认为成功
        },
        onDone: () => resolve({ ok: true }),
        onError: (e) => resolve({ ok: false, error: e }),
      },
    );
  });
}
