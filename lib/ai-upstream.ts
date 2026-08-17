/** 服务端 AI Ping / OpenAI 兼容上游调用 */

export type AiChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type AiCompletionOptions = {
  messages: AiChatMessage[];
  temperature?: number;
  maxTokens?: number;
  jsonMode?: boolean;
  timeoutMs?: number;
};

export type AiCompletionResult =
  | { ok: true; content: string }
  | { ok: false; status: number; error: string; detail?: string };

const DEFAULT_TIMEOUT_MS = 30000;

export function getAiConfig():
  | { baseUrl: string; apiKey: string; model: string }
  | null {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();
  if (!baseUrl || !apiKey || !model) return null;
  return { baseUrl, apiKey, model };
}

export async function aiChatCompletion(
  options: AiCompletionOptions,
): Promise<AiCompletionResult> {
  const cfg = getAiConfig();
  if (!cfg) {
    return { ok: false, status: 503, error: "AI_NOT_CONFIGURED" };
  }

  const upstream = cfg.baseUrl.replace(/\/+$/, "");
  const controller = new AbortController();
  const timer = setTimeout(
    () => controller.abort(),
    options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  );

  try {
    const resp = await fetch(`${upstream}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        ...(options.maxTokens ? { max_tokens: options.maxTokens } : {}),
        ...(options.jsonMode
          ? { response_format: { type: "json_object" } }
          : {}),
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!resp.ok) {
      const detail = await resp.text().catch(() => "");
      return {
        ok: false,
        status: 502,
        error: "AI_UPSTREAM_ERROR",
        detail: detail.slice(0, 300),
      };
    }

    const data = await resp.json();
    const content: string =
      (data.choices &&
        data.choices[0] &&
        data.choices[0].message &&
        data.choices[0].message.content) ||
      "";
    if (!content.trim()) {
      return { ok: false, status: 502, error: "AI_EMPTY_OUTPUT" };
    }
    return { ok: true, content: content.trim() };
  } catch {
    clearTimeout(timer);
    return { ok: false, status: 504, error: "AI_REQUEST_FAILED" };
  }
}

export function aiErrorResponse(result: Extract<AiCompletionResult, { ok: false }>) {
  return Response.json(
    { error: result.error, ...(result.detail ? { detail: result.detail } : {}) },
    { status: result.status },
  );
}
