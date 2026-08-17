import type { EmotionKey, ScoreDetail, ScoreReasons, Scores } from "./types";

/**
 * 「四个指数」评分引擎（规则版）。
 *
 * 核心理念：四个指数都不是评价「你这个人有多好」，
 * 而是评价「这一次经历中，你做了什么、以及相比过去发生了什么变化」。
 *
 * - 🌱 韧性指数：我如何面对困难？
 * - 🪞 自省指数：我是否理解自己？
 * - ⚡ 行动指数：我有没有做出改变？
 * - 🌿 成长指数：我相比过去改变了吗？（依赖历史）
 *
 * 后端接入真实 LLM 后，可替换为 AI 评分；契约（字段名、0-100、五级文案）保持不变。
 */

export interface ScoreInput {
  emotion: EmotionKey;
  content: string;
  lesson: string;
  next_action: string;
  growth_evidence: string;
  growth_insight?: string;
  growth_area?: string | null;
}

/** 成长指数所需的历史上下文 */
export interface GrowthHistory {
  /** 历史记录里出现过的 growth_area 列表（用于判断「能力是否反复出现」） */
  growthAreas: string[];
  /** 是否有过任何历史记录 */
  hasHistory: boolean;
}

export type { Scores };

// ============================================================
// 关键词表（规则评分用）
// ============================================================

const EMOTION_WORDS = [
  "难过", "开心", "焦虑", "生气", "愤怒", "累", "疲惫", "迷茫", "慌", "烦",
  "委屈", "害怕", "紧张", "兴奋", "感动", "感激", "满足", "失落", "低落",
  "伤心", "痛苦", "压抑", "憋屈", "崩溃", "烦躁", "不安", "沮丧", "难受",
  "纠结", "矛盾", "慌", "担心",
];

const CAUSE_WORDS = [
  "因为", "原因", "其实", "原来", "发现", "是我", "所以", "结果", "导致",
  "说明", "问题出在", "没提前", "没想到", "意识到", "明白", "反省", "反思",
];

const PATTERN_WORDS = [
  "以前", "过去", "总是", "每次", "一直", "反复", "又", "老", "经常",
  "上次", "上回", "从小", "从来",
];

const COGNITION_WORDS = [
  "不是", "而是", "其实", "并不", "只是", "说明", "发现", "意识到", "原来",
  "理解", "也许", "可能只是", "不代表",
];

const ACTION_WORDS = [
  "准备", "整理", "写", "练习", "问", "找", "列", "设置", "模拟", "计划",
  "尝试", "记录", "复盘", "拆", "安排", "约", "练", "做",
];

const TIME_WORDS = [
  "明天", "今晚", "下次", "这周", "周末", "马上", "现在", "今天", "早上",
  "晚上", "每天", "半小时", "一小时", "周一", "周二", "周三", "周四", "周五",
  "周六", "周日",
];

const CHANGE_WORDS = [
  "以前", "过去", "现在", "不再", "开始", "学会", "能", "敢", "愿意", "主动",
  "第一次", "这次", "终于",
];

/** 文本质量 0-100：字数深度（60）+ 关键词命中（40）。
 *  当 requireHit=true 时，若一个关键词都没命中，直接返回 0 ——
 *  用于「情绪觉察」「原因探索」这类必须靠关键词才能确认的维度，
 *  避免纯靠字数（哪怕是无意义文字）就拿到分。 */
function quality(text: string, keywords: string[], requireHit = false): number {
  const t = (text || "").trim();
  if (!t) return 0;
  const hits = keywords.filter((k) => t.includes(k)).length;
  if (requireHit && hits === 0) return 0;
  const depth = Math.min(1, t.length / 24);
  const kwScore = Math.min(1, hits / 2);
  return Math.round(Math.min(100, depth * 60 + kwScore * 40));
}

// ============================================================
// 🌱 韧性指数：我如何面对困难？
// 情绪觉察 25 + 反思能力 25 + 行动转化 25 + 适应变化 25
// ============================================================
export function computeResilienceScore(input: ScoreInput): number {
  const awareness = quality(input.content, EMOTION_WORDS, true); // 情绪觉察（需命中情绪词）
  const reflect = quality(input.lesson, []); // 反思能力
  const action = quality(input.next_action, ACTION_WORDS); // 行动转化
  const adapt = quality(input.growth_evidence, CHANGE_WORDS); // 适应变化
  return Math.round((awareness + reflect + action + adapt) / 4);
}

// ============================================================
// 🪞 自省指数：我是否理解自己？
// 情绪识别 30 + 原因探索 30 + 模式识别 20 + 自我理解 20
// ============================================================
export function computeReflectionScore(input: ScoreInput): number {
  const emotion = quality(input.content, EMOTION_WORDS, true); // 情绪识别（需命中情绪词）
  const cause = quality(
    `${input.content} ${input.lesson}`,
    CAUSE_WORDS,
    true
  ); // 原因探索（需命中原因词）
  const pattern = quality(input.growth_evidence, PATTERN_WORDS); // 模式识别
  const self = quality(input.lesson, COGNITION_WORDS); // 自我理解
  return Math.round(0.3 * emotion + 0.3 * cause + 0.2 * pattern + 0.2 * self);
}

// ============================================================
// ⚡ 行动指数：我有没有做出改变？
// 目标明确 25 + 行动具体 25 + 可执行性 25 + 后续反馈 25
// （「后续反馈」需要未来回访，当前用 next_action 的落地程度近似）
// ============================================================
export function computeActionScore(input: ScoreInput): number {
  const na = input.next_action.trim();
  if (!na) return 0;
  const goal = quality(na, ["要", "准备", "先", "下次", "计划", "目标", "解决", "避免"]);
  const specific = quality(na, ACTION_WORDS);
  const executable = quality(na, TIME_WORDS);
  const followup = quality(na, ["先", "开始", "做", "试"]); // 落地倾向
  return Math.round(0.25 * goal + 0.25 * specific + 0.25 * executable + 0.25 * followup);
}

// ============================================================
// 🌿 成长指数：我相比过去改变了吗？（依赖历史）
// 行为变化 30 + 应对方式变化 30 + 认知变化 20 + 能力形成证据 20
// ============================================================
export function computeGrowthScore(
  input: ScoreInput,
  history: GrowthHistory
): number {
  // 注意：不再用自动生成的 growth_insight 打分（那是模板/AI 文案，含「这次」等
  // 触发词，会让空反思也虚增成长分）。成长指数只看用户真实写下的内容。
  const behavior = quality(input.growth_evidence, CHANGE_WORDS); // 行为变化（我比以前强在哪）
  const response = quality(input.next_action, CHANGE_WORDS); // 应对方式变化（下次怎么做里是否体现改变）
  const cognition = quality(input.lesson, COGNITION_WORDS); // 认知变化（学到了什么）

  // 能力形成证据：growth_area 在历史里反复出现 → 能力正在形成
  let ability = 0;
  if (input.growth_area) {
    const count = history.growthAreas.filter((a) => a === input.growth_area).length;
    if (count >= 2) ability = 90;
    else if (count >= 1) ability = 60;
    else ability = 40;
  }
  // 没有历史时，「能力形成」无法对比，略降权
  if (!history.hasHistory) ability = Math.min(ability, 30);

  return Math.round(0.3 * behavior + 0.3 * response + 0.2 * cognition + 0.2 * ability);
}

/** 一次性计算四个指数 */
export function computeAllScores(
  input: ScoreInput,
  history: GrowthHistory
): Scores {
  return {
    resilience: computeResilienceScore(input),
    reflection: computeReflectionScore(input),
    action: computeActionScore(input),
    growth: computeGrowthScore(input, history),
  };
}

// ============================================================
// 统一五级等级
// ============================================================

export interface ScoreLevel {
  min: number;
  max: number;
  emoji: string;
  label: string;
  note: string;
}

export const SCORE_LEVELS: ScoreLevel[] = [
  { min: 0, max: 20, emoji: "🌧️", label: "情绪承受期", note: "先照顾自己" },
  { min: 21, max: 40, emoji: "🌱", label: "开始觉察", note: "我开始看见它" },
  { min: 41, max: 60, emoji: "🌿", label: "正在理解", note: "我正在理解它" },
  { min: 61, max: 80, emoji: "🌳", label: "开始转化", note: "我知道下一步了" },
  { min: 81, max: 100, emoji: "✨", label: "形成能力", note: "我带走了新的力量" },
];

export function levelOf(score: number): ScoreLevel {
  return (
    SCORE_LEVELS.find((l) => score >= l.min && score <= l.max) ??
    SCORE_LEVELS[SCORE_LEVELS.length - 1]
  );
}

// ============================================================
// 评分理由（「为什么是这个分」）
//
// 规则版打分是关键词估算，不是 AI 判断。为了让数字可信，
// 这里为每个指数生成一句诚实的解释，说明它到底依据了什么。
// ============================================================

/** 规则版评分的统一说明（前端展示「这是估算值」时使用） */
export const RULE_SCORE_NOTE =
  "以下分数由本地规则估算，不是 AI 打分，仅供参考。它衡量的是「这一次经历中你写下了什么」，不是评价你这个人。";

/** 判断文本是否命中某个关键词表 */
function hasHit(text: string, keywords: string[]): boolean {
  return keywords.some((k) => (text || "").includes(k));
}

function truncate(s: string, n: number): string {
  const t = s.trim();
  return t.length > n ? t.slice(0, n) + "…" : t;
}

function buildScoreReasons(
  input: ScoreInput,
  history: GrowthHistory
): ScoreReasons {
  const hasContent = !!input.content.trim();
  const hasLesson = !!input.lesson.trim();
  const hasNext = !!input.next_action.trim();
  const hasEvidence = !!input.growth_evidence.trim();

  const resilienceBits = [
    hasHit(input.content, EMOTION_WORDS) ? "写下了情绪感受" : "没有写出情绪感受",
    hasLesson ? "有反思" : "没有反思",
    hasNext ? "有下一步行动" : "没有行动",
    hasEvidence ? "有成长证据" : "没有成长证据",
  ];
  const resilience = `韧性看的是你这次怎么面对它：${resilienceBits.join("、")}。${
    !hasContent && !hasLesson && !hasNext && !hasEvidence
      ? "这一篇还没有写下这些内容，所以分数很低——这只是当前的状态，不代表别的。"
      : ""
  }`;

  const reflectionBits = [
    hasHit(input.content, EMOTION_WORDS) ? "识别到情绪" : "没有识别到情绪",
    hasHit(`${input.content} ${input.lesson}`, CAUSE_WORDS)
      ? "在找原因"
      : "没有找原因",
    hasHit(input.growth_evidence, PATTERN_WORDS)
      ? "发现了自己的模式"
      : "没有发现模式",
    hasHit(input.lesson, COGNITION_WORDS) ? "有自我理解" : "没有自我理解",
  ];
  const reflection = `自省看的是你有没有理解自己：${reflectionBits.join("、")}。`;

  const action = hasNext
    ? `行动看的是你有没有打算改变：你写下了「${truncate(input.next_action, 16)}」，写得越具体、越可执行，分数越高。`
    : "行动看的是你有没有打算改变：这次没有写下「下次怎么做」，所以行动分是 0。";

  let growth: string;
  if (hasEvidence) {
    growth =
      "成长看的是相比过去有没有变化：你写下了成长证据，所以这项有分" +
      (history.hasHistory
        ? "，并结合了历史能力标签做对比。"
        : "；但目前还没有历史记录可对比，所以这项会略打折扣。");
  } else {
    growth =
      "成长看的是相比过去有没有变化：这次没有写下成长证据，所以成长分是 0——这不代表你没成长，只是这次还没写出来。";
  }

  return { resilience, reflection, action, growth };
}

/** 一次性计算四个指数 + 来源 + 理由（规则版估算） */
export function computeScoreDetail(
  input: ScoreInput,
  history: GrowthHistory
): ScoreDetail {
  return {
    scores: computeAllScores(input, history),
    source: "rule",
    reasons: buildScoreReasons(input, history),
    note: RULE_SCORE_NOTE,
  };
}
