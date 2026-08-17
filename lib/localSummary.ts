import { analyzeEmotion } from "./emotionAnalysis";
import { buildReflectionResponse } from "./reflection";
import { computeScoreDetail } from "./scores";
import type { ChatMessage, ChatSummaryResponse, EmotionKey } from "./types";

/**
 * AI 不可用时的「本地规则降级」归纳。
 *
 * 用于聊天总结 / 快速保存这两条路径在没有 LLM 时也能走完主流程：
 * - 情绪：analyzeEmotion 关键词规则识别（可能有偏差，用户可在确认卡里改）
 * - content：优先用纸条，其次用聊天里用户说的话拼起来
 * - 三问：规则无法可靠提炼，一律留空，交由用户在确认卡里自行填写
 * - 四指数：computeScoreDetail 规则版（含每个指数的理由，标注「估算值」）
 * - ai_response：buildReflectionResponse 模板（措辞偏中性，不强行正向）
 *
 * 关键：fallback=true 会让确认卡顶部显示「AI 暂不可用」提示，
 * 用户能明确知道这是降级结果，而不是被误导。
 */
export function buildLocalSummary(
  context: string | undefined,
  messages: ChatMessage[]
): ChatSummaryResponse {
  const userText = messages
    .filter((m) => m.role === "user")
    .map((m) => m.content)
    .join("\n")
    .trim();

  const content = (context ?? "").trim() || userText;
  const emotion: EmotionKey = analyzeEmotion((context ?? "") || userText);

  const lesson = "";
  const next_action = "";
  const growth_evidence = "";

  const scoreDetail = computeScoreDetail(
    { emotion, content, lesson, next_action, growth_evidence },
    { growthAreas: [], hasHistory: false }
  );
  const ai_response = buildReflectionResponse(emotion, {
    lesson,
    next_action,
    growth_evidence,
  });

  return {
    emotion,
    content,
    lesson,
    next_action,
    growth_evidence,
    scores: scoreDetail.scores,
    score_source: scoreDetail.source,
    score_reasons: scoreDetail.reasons,
    ai_response,
    fallback: true,
  };
}
