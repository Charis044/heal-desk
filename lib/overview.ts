import { getEmotion } from "./emotions";
import { buildGrowthProfile } from "./growthProfile";
import type {
  ChatEmotionCount,
  ChatRecord,
  DiaryEntry,
  EmotionKey,
  OverviewAnalysis,
} from "./types";

/**
 * 「个人全方面分析」生成逻辑（服务端）。
 *
 * 依据两处数据：
 * 1. 纸堆（日记）——用 buildGrowthProfile 提炼成长信号（能力标签、过去→现在）。
 * 2. 聊天记录——统计聊了几次、聊了什么情绪，作为「表达与倾诉」的侧面。
 *
 * 不是人格测试，不做游戏化，只突出「正在发生的成长与改变」。
 */

/** 生成一句总述（规则版，不强行正向） */
function buildSummary(
  reflectedCount: number,
  entryCount: number,
  chatCount: number,
  growthAreas: string[],
  patternsCount: number
): string {
  if (entryCount === 0) {
    return "这里还没有记录。写下第一篇，改变会慢慢显出来。";
  }
  const parts: string[] = [];
  if (reflectedCount > 0) {
    parts.push(`你已经在 ${reflectedCount} 次经历里认真复盘过`);
  }
  if (patternsCount > 0) {
    parts.push(`${patternsCount} 个地方正在悄悄改变`);
  }
  if (growthAreas.length > 0) {
    parts.push(`正在长出「${growthAreas[0]}」`);
  }
  if (chatCount > 0) {
    parts.push(`和拼忆书屋聊过 ${chatCount} 次`);
  }
  if (parts.length === 0) {
    return "你把日子写下来了。改变不一定快，但它在发生。";
  }
  return parts.join("，") + "。";
}

export function buildOverview(
  entries: DiaryEntry[],
  chats: ChatRecord[]
): OverviewAnalysis {
  // 纸堆侧的成长画像（不含沟通风格，这里不展示）
  const profile = buildGrowthProfile(entries, null);

  // 已做三问复盘的条数
  const reflectedCount = entries.filter(
    (e) =>
      e.lesson?.trim() ||
      e.next_action?.trim() ||
      e.growth_evidence?.trim() ||
      e.growth_area
  ).length;

  // 聊天情绪分布（只统计有情绪的）
  const emoCount = new Map<EmotionKey, number>();
  for (const c of chats) {
    if (!c.emotion) continue;
    emoCount.set(c.emotion, (emoCount.get(c.emotion) ?? 0) + 1);
  }
  const chatEmotions: ChatEmotionCount[] = [...emoCount.entries()]
    .map(([emotion, count]) => ({ emotion, count }))
    .sort((a, b) => b.count - a.count);

  return {
    entry_count: entries.length,
    reflected_count: reflectedCount,
    chat_count: chats.length,
    strengths: profile.strengths,
    patterns: profile.patterns,
    growth_areas: profile.growth_areas,
    chat_emotions: chatEmotions,
    summary: buildSummary(
      reflectedCount,
      entries.length,
      chats.length,
      profile.growth_areas,
      profile.patterns.length
    ),
  };
}

/** 聊天情绪标签的展示颜色（供前端复用，避免重复 import emotions） */
export function chatEmotionLabel(key: EmotionKey): string {
  return getEmotion(key).label;
}
