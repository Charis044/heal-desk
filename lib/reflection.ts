import { getEmotion } from "./emotions";
import type { EmotionKey } from "./types";

/**
 * 三问反思的 Mock 生成逻辑：
 * - 韧性指数（resilience_score）
 * - AI 复盘回应（ai_response）
 *
 * 后端就绪后，这两个值由服务端在 POST /api/diary 时统一生成，
 * 前端预览与最终保存共用同一套逻辑，保证一致。
 */

export interface ReflectionInput {
  lesson: string;
  next_action: string;
  growth_evidence: string;
}

/**
 * AI 复盘回应（Mock）。
 * 负面情绪「承认糟糕」+ 肯定觉察；积极情绪「肯定这份情绪本身」+ 肯定觉察。
 * 不做正向或负向的强行引导。
 */
export function buildReflectionResponse(
  emotion: EmotionKey,
  input: ReflectionInput
): string {
  const ack: Record<EmotionKey, string> = {
    sad: "这次确实让你很难过",
    angry: "这次确实让人生气",
    anxious: "这次确实很糟糕",
    tired: "这段时间确实把你累坏了",
    confused: "这段看不清方向的日子确实不容易",
    calm: "这件事确实不容易",
    happy: "这份开心，值得被好好记住",
    excited: "这股兴奋劲儿，很珍贵",
    moved: "被触动的感觉，很珍贵",
    hopeful: "心里有光，是很好的事",
    grateful: "能感到感激，是一份暖意",
    content: "觉得满足，是很踏实的",
  };

  const strengths: string[] = [];
  // 措辞降低确定性：这是「观察到你写下了这些」，不是替用户下结论，
  // 避免对自嘲/反讽内容强行正向。
  if (input.lesson.trim()) strengths.push("你试着从里面带走了一点东西");
  if (input.next_action.trim()) strengths.push("你开始想下一次可以怎么做");
  if (input.growth_evidence.trim()) strengths.push("你感觉到自己比过去有了一点变化");

  const lead = ack[emotion] ?? "这件事确实不容易";
  if (strengths.length === 0) {
    return `${lead}。愿意认真把它写下来，已经很不容易了。`;
  }
  // 积极情绪用「而且」自然衔接，负面 / 中性用「但」承接转折
  const connector = getEmotion(emotion).group === "positive" ? "而且" : "但";
  return `${lead}。${connector}${strengths.join("，")}。`;
}

// ============================================================
// 成长发现（反脆弱）：历史对比 + 正在形成的能力
// ============================================================

export interface GrowthFindings {
  growth_insight: string;
  growth_area: string | null;
}

/** 从三问里提炼「正在形成的能力」标签（关键词匹配，找不到则默认自我觉察） */
const AREA_RULES: [string[], string][] = [
  [["反馈", "寻找", "求助", "寻求", "主动"], "抗拒绝"],
  [["觉察", "情绪", "看见", "听见", "感受"], "自我觉察"],
  [["边界", "拒绝", "说不", "沟通", "表达"], "设立边界"],
  [["接纳", "允许", "放下", "接受"], "自我接纳"],
  [["行动", "下一步", "计划", "开始", "先"], "行动力"],
  [["坚持", "继续", "面对", "不逃"], "韧性"],
];

function detectArea(input: ReflectionInput): string | null {
  const text = `${input.growth_evidence} ${input.next_action} ${input.lesson}`;
  for (const [keywords, area] of AREA_RULES) {
    if (keywords.some((k) => text.includes(k))) return area;
  }
  return null;
}

/**
 * 生成「AI 发现」（growth_insight）+「正在形成的能力」（growth_area）。
 *
 * 关键原则：不强行正向解释。
 * - 若用户确实写出了成长（growth_evidence 非空），做历史对比，指出「这次不同」。
 * - 若没有成长，诚实地说「目前还不一定找到答案，也没关系」，growth_area 留空。
 *
 * 反脆弱不是「所有坏事都有好结果」，而是「即使没变好，也能逐渐学会面对」。
 */
export function buildGrowthFindings(
  emotion: EmotionKey,
  input: ReflectionInput,
  historyEmotions: EmotionKey[]
): GrowthFindings {
  const emo = getEmotion(emotion);
  const hasGrowth = input.growth_evidence.trim().length > 0;

  if (!hasGrowth) {
    return {
      growth_insight:
        "这次真的很难受。目前还不一定能从中找到答案，也没关系。",
      growth_area: null,
    };
  }

  const historyCount = historyEmotions.filter((e) => e === emotion).length;
  let insight: string;
  if (historyCount >= 1) {
    insight = `以前遇到「${emo.label}」的时候，你更容易停在那里；这一次，你开始想下一步了。`;
  } else {
    insight = `这是你第一次记下「${emo.label}」——你没有停在情绪里，而是开始想「学到了什么」「下一步怎么做」。`;
  }

  const area = detectArea(input) ?? "自我觉察";
  return { growth_insight: insight, growth_area: area };
}
