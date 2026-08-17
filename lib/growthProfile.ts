import { getEmotion } from "./emotions";
import type {
  DiaryEntry,
  EmotionKey,
  GrowthProfile,
  PatternShift,
  StrengthInsight,
  SupportPreferenceKey,
} from "./types";

/**
 * 「我的成长画像」生成逻辑（服务端）。
 *
 * 核心原则：
 * 1. 不是人格测试，也不是游戏化等级。只总结「正在发生的变化」。
 * 2. 真实历史行为是主要依据；MBTI 只作初始信息，不体现在这里。
 * 3. 不强行正向解释——若用户还没表现出成长，就不硬说「你变强了」。
 *
 * 输入为全部历史日记 + 用户画像里的 support_preference（弱上下文）。
 * 后端就绪后，可由 LLM 替换这里的规则生成，契约保持不变。
 */

/** 能力标签 → 一句观察（用于顶部「AI 动态发现」） */
const AREA_NOTES: Record<string, string> = {
  自我觉察: "你越来越能区分事实和自己的评价。",
  抗拒绝: "你仍然会失落，但恢复速度比过去更快。",
  接受反馈: "你开始把批评看成可以使用的信息。",
  设立边界: "你开始能说出自己的需要，而不是默默承受。",
  自我接纳: "你越来越允许自己不完美。",
  行动力: "你不再停在情绪里，而是更快地迈出第一步。",
  韧性: "遇到困难时，你越来越知道怎么重新站稳。",
};

/** 情绪 → 行为模式模板（过去 vs 现在）。只在确有成长时才使用。 */
const PATTERN_TEMPLATES: Record<
  EmotionKey,
  { trigger: string; before: string[]; after: string[]; summary: string }
> = {
  sad: {
    trigger: "被否定",
    before: ["自我怀疑", "想放弃"],
    after: ["允许自己难过", "复盘", "寻找可改的地方"],
    summary: "以前，你更容易在被否定后怀疑自己；最近，你开始试着去找具体能改的地方。",
  },
  angry: {
    trigger: "被冒犯或不公",
    before: ["沉默", "越想越气", "憋成下一次更大的火"],
    after: ["就事论事", "保留证据", "把话说清"],
    summary: "以前，你更容易把气憋在心里；最近，你开始试着就事论事地把边界说清。",
  },
  anxious: {
    trigger: "面对不确定",
    before: ["反复预演最坏情况", "想逃避"],
    after: ["把焦虑当成信号", "拆成小步去准备"],
    summary: "以前，焦虑会让你想逃；最近，你开始把它当成一种提醒，去准备还没想清的地方。",
  },
  tired: {
    trigger: "被过度透支",
    before: ["硬撑", "直到崩溃"],
    after: ["听见身体的信号", "及时停下来"],
    summary: "以前，你会硬撑到崩溃；最近，你开始能听见身体发出的信号。",
  },
  confused: {
    trigger: "看不清方向",
    before: ["停在原地", "自我怀疑"],
    after: ["先迈一小步", "边走边看"],
    summary: "以前，迷茫会让你停在原地；最近，你开始允许自己先走一小步。",
  },
  calm: {
    trigger: "面对波动",
    before: ["情绪起伏大", "难以安静下来"],
    after: ["先让自己稳一稳", "再慢慢看"],
    summary: "以前，波动容易把你卷进去；最近，你越来越能先让自己安静下来。",
  },
  happy: {
    trigger: "开心的时候",
    before: ["容易忽略这份开心"],
    after: ["允许自己好好停留一会儿"],
    summary: "以前，开心很快就被你放走了；最近，你开始愿意为它停一停。",
  },
  excited: {
    trigger: "兴奋的时候",
    before: ["兴奋很快被自我怀疑盖过"],
    after: ["允许自己保有这份劲儿"],
    summary: "以前，兴奋容易被自我怀疑盖过；最近，你开始愿意接住这份劲儿。",
  },
  moved: {
    trigger: "被触动的时候",
    before: ["把感动悄悄收起来"],
    after: ["允许自己被触动"],
    summary: "以前，感动被你悄悄收起来；最近，你开始允许自己被触动。",
  },
  hopeful: {
    trigger: "心里有光的时候",
    before: ["不敢太期待"],
    after: ["允许自己保留一点希望"],
    summary: "以前，你不太敢期待；最近，你开始允许自己保留一点希望。",
  },
  grateful: {
    trigger: "感到感激的时候",
    before: ["容易忽略这份暖意"],
    after: ["愿意把它记下来"],
    summary: "以前，感激常常被你忽略；最近，你开始愿意把它记下来。",
  },
  content: {
    trigger: "感到满足的时候",
    before: ["总觉得还不够"],
    after: ["允许自己觉得满足"],
    summary: "以前，你总觉得还不够；最近，你开始允许自己觉得满足。",
  },
};

/** 沟通风格（弱上下文，来自 support_preference） */
const COMMUNICATION_STYLES: Record<SupportPreferenceKey, string> = {
  listen_first: "先共情，少给建议",
  analyze: "先共情，再帮理清",
  solve: "先共情，再一起想下一步",
  listen_then_reflect: "先共情，再一起复盘",
};

/**
 * 生成成长画像。
 * @param entries 全部历史日记（时间倒序）
 * @param supportPreference 用户画像里的陪伴偏好（可空）
 */
export function buildGrowthProfile(
  entries: DiaryEntry[],
  supportPreference: SupportPreferenceKey | null
): GrowthProfile {
  // 按时间正序（旧 → 新），便于做「过去 vs 现在」对比
  const ordered = [...entries].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const profile: GrowthProfile = {
    strengths: [],
    patterns: [],
    growth_areas: [],
    communication_style: supportPreference
      ? COMMUNICATION_STYLES[supportPreference]
      : "",
  };

  // 只统计「做过三问反思」的记录（有成长信号）
  const reflected = ordered.filter(
    (e) =>
      e.lesson?.trim() ||
      e.next_action?.trim() ||
      e.growth_evidence?.trim() ||
      e.growth_area
  );
  if (reflected.length === 0) return profile;

  // —— growth_areas：聚合已有 growth_area 标签，按出现次数排序 ——
  const areaCount = new Map<string, number>();
  for (const e of reflected) {
    const area = e.growth_area?.trim();
    if (area) areaCount.set(area, (areaCount.get(area) ?? 0) + 1);
  }
  // 若没有显式标签，从「有成长证据」的记录里兜底一个「自我觉察」
  const growthAreas = [...areaCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label]) => label)
    .slice(0, 3);
  if (growthAreas.length === 0 && reflected.some((e) => e.growth_evidence?.trim())) {
    growthAreas.push("自我觉察");
  }
  profile.growth_areas = growthAreas;

  // —— strengths：能力标签 + 一句观察（最多 3 个） ——
  profile.strengths = growthAreas.map<StrengthInsight>((label) => ({
    label,
    note: AREA_NOTES[label] ?? "你正在一点点改变。",
  }));

  // —— patterns：按情绪聚合，只在「确有成长」时生成「过去 → 现在」 ——
  const byEmotion = new Map<EmotionKey, DiaryEntry[]>();
  for (const e of reflected) {
    const list = byEmotion.get(e.emotion) ?? [];
    list.push(e);
    byEmotion.set(e.emotion, list);
  }

  const patterns: PatternShift[] = [];
  for (const [emotion, list] of byEmotion) {
    // 该情绪需出现 ≥2 次，且最近一次确有成长证据，才构成「正在改变」
    const latest = list[list.length - 1];
    const hasGrowth =
      (latest.growth_evidence?.trim() ?? "").length > 0 ||
      (latest.growth_area?.trim() ?? "").length > 0;
    if (list.length < 2 || !hasGrowth) continue;

    const tpl = PATTERN_TEMPLATES[emotion];
    if (!tpl) continue;
    patterns.push({
      trigger: tpl.trigger,
      before: tpl.before,
      after: tpl.after,
      summary: tpl.summary,
    });
    if (patterns.length >= 3) break;
  }
  profile.patterns = patterns;

  return profile;
}
