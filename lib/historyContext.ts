import { localDateKey } from "./date";
import { getEmotion } from "./emotions";
import type { DiaryEntry } from "./types";

/**
 * 「过往纸堆」上下文生成（仅服务端使用）。
 *
 * 目的：让 AI 对话能「记得」用户过去写下的经历，从而更连贯、更有延续感
 * （比如能自然地说出「你上次也遇到过类似的事」）。
 *
 * 关键：上下文窗口有限，所以从「最近」往「更早」累积，
 * 一旦超出字符预算就丢弃更旧的内容 —— 即「先忘记旧的纸堆」。
 */

/** 历史纸堆上下文的总字符预算（超过就截断旧的） */
export const HISTORY_CONTEXT_BUDGET = 3000;

/** 单条纸堆 content 的最大字符数（太长的经历只取开头，避免挤占预算） */
const MAX_CONTENT_CHARS = 60;

/**
 * 生成「过往纸堆」摘要字符串。
 * @param entries 全部历史日记（可乱序，内部会按时间倒序重排）
 * @param budget  总字符预算，超出则丢弃更旧的记录
 * @returns 摘要文本；无有效记录时返回空字符串
 */
export function buildHistoryDigest(
  entries: DiaryEntry[],
  budget = HISTORY_CONTEXT_BUDGET
): string {
  if (!entries.length) return "";

  // 按时间倒序（最近的在前），保证「先忘记旧」的顺序正确
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const lines: string[] = [];
  let used = 0;
  for (const e of sorted) {
    const content = (e.content || "").trim();
    if (!content) continue;

    // MM-DD，避免太长
    const date = localDateKey(e.created_at).slice(5);
    const emotion = getEmotion(e.emotion).label;
    const short =
      content.length > MAX_CONTENT_CHARS
        ? content.slice(0, MAX_CONTENT_CHARS) + "…"
        : content;
    const line = `- [${emotion}] ${date} ${short}`;

    // 超出预算就停：更旧的记录不再保留（先忘记旧的）
    if (used + line.length > budget) break;
    lines.push(line);
    used += line.length;
  }

  return lines.length ? lines.join("\n") : "";
}
