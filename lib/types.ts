// ============================================================
// API 契约类型定义（前后端共享的唯一事实来源）
//
// 后端就绪后，仅需替换 lib/api.ts 中的数据源实现，
// 这里的类型与 UI 组件完全无需改动。
// ============================================================

/**
 * 12 种情绪（无好坏之分，只是记录生活的情绪轨迹）。
 *
 * 负面 / 困扰：sad / angry / anxious / tired / confused
 * 中性 / 稳定：calm
 * 积极 / 明亮：happy / excited / moved / hopeful / grateful / content
 */
export type EmotionKey =
  | "sad"
  | "angry"
  | "anxious"
  | "tired"
  | "confused"
  | "calm"
  | "happy"
  | "excited"
  | "moved"
  | "hopeful"
  | "grateful"
  | "content";

/** 情绪分组（仅用于展示与语气微调，不代表「好坏」） */
export type EmotionGroup = "negative" | "neutral" | "positive";

/** 四个指数（0-100 整数）。契约：字段名固定、范围 0-100、五级文案见 scores.ts */
export interface Scores {
  resilience: number;
  reflection: number;
  action: number;
  growth: number;
}

/** 评分来源：LLM 真实打分 vs 本地规则估算 */
export type ScoreSource = "llm" | "rule";

/** 每个指数的一句「为什么是这个分」 */
export interface ScoreReasons {
  resilience: string;
  reflection: string;
  action: string;
  growth: string;
}

/**
 * 评分详情（数值 + 来源 + 理由）。
 * 前端据此区分「AI 打分」与「规则估算」，并展示每个指数的解释。
 */
export interface ScoreDetail {
  scores: Scores;
  source: ScoreSource;
  reasons: ScoreReasons;
  /** source=rule 时的一句总说明（如「以下为本地规则估算，仅供参考」） */
  note: string;
}

/** 笔记来源：打字机手写 vs 小熊咨询压缩稿 */
export type DiarySource = "handwritten" | "bear";

/** 一条日记记录（POST /api/diary 的返回结构） */
export interface DiaryEntry {
  id: string;
  emotion: EmotionKey;
  content: string;
  /** 缺省视为 handwritten */
  source?: DiarySource;
  /**
   * 划掉：不从列表移除，全文删除线。
   * 仅表示不在总结 / 图表中读取，可以反悔取消。
   */
  excluded_from_insights?: boolean;
  /** 小熊咨询对应的完整对话 id，点回去用 */
  chat_id?: string | null;
  lesson: string;
  next_action: string;
  growth_evidence: string;
  /**
   * 韧性指数（0-100 整数）。
   * 不是「你是一个 XX 分的人」，只是「这一次面对困难的方式」的观察值，
   * 无等级、无排行榜、无经验值、无游戏化奖励。
   */
  resilience_score: number;
  /** 自省指数（0-100，我是否理解自己） */
  reflection_score?: number;
  /** 行动指数（0-100，我有没有做出改变） */
  action_score?: number;
  /** 成长指数（0-100，我相比过去改变了吗，依赖历史） */
  growth_score?: number;
  /** AI 复盘/共情回应 */
  ai_response: string;
  /** AI 发现：这次与过去的对比观察（由 AI 基于当前 + 历史生成） */
  growth_insight?: string;
  /** 正在形成的能力标签（如「抗拒绝」，AI 生成，可能为空） */
  growth_area?: string | null;
  /** 评分来源（llm=AI 打分 / rule=规则估算） */
  score_source?: ScoreSource;
  /** 每个指数的理由，历史页回看时展示 */
  score_reasons?: ScoreReasons;
  /** 软删除时间（ISO 8601）；有值表示在回收站中，30 天后自动清理 */
  deleted_at?: string | null;
  /** ISO 8601 字符串 */
  created_at: string;
}

/** 创建日记的请求体（POST /api/diary） */
export interface CreateDiaryInput {
  emotion: EmotionKey;
  content: string;
  lesson: string;
  next_action: string;
  growth_evidence: string;
  /** 可选：LLM 直接产出的四指数；缺省时后端用规则版计算 */
  scores?: Scores;
  /** 可选：评分来源（llm=AI 打分 / rule=规则估算），缺省按 rule 处理 */
  score_source?: ScoreSource;
  /** 可选：每个指数的理由（LLM 产出时随 scores 一并传入） */
  score_reasons?: ScoreReasons;
  /** 可选：LLM 产出的 AI 复盘回应；缺省时后端用模板 */
  ai_response?: string;
  source?: DiarySource;
  chat_id?: string | null;
}

/** 补做三问 / 编辑记录的请求体（PATCH /api/diary/:id，字段按需传，缺省不覆盖） */
export interface UpdateDiaryInput {
  lesson?: string;
  next_action?: string;
  growth_evidence?: string;
  /** 编辑原始日记内容 */
  content?: string;
  /** 编辑情绪 */
  emotion?: EmotionKey;
  /** 划掉 / 取消划掉（不进总结与图表） */
  excluded_from_insights?: boolean;
}

// ============================================================
// AI 起头（三问复盘的「让 AI 帮我想想」）
// 契约：POST /api/ai/reflect
// AI 只给商量语气的草稿，用户确认后才写入数据，绝不代答。
// ============================================================

/** 三问的字段名（与 DiaryEntry 对齐） */
export type ReflectionQuestionKey = "lesson" | "next_action" | "growth_evidence";

/** AI 起头请求体（针对当前这一问） */
export interface ReflectRequest {
  emotion: EmotionKey;
  content: string;
  question: ReflectionQuestionKey;
}

/** AI 起头响应体 */
export interface ReflectResponse {
  suggestion: string;
}

// ============================================================
// AI 聊天（「今天发生了什么」升级为聊天窗口）
// 契约：POST /api/ai/chat（多轮对话）、POST /api/ai/chat/summary（对话总结）
// AI 前期是「心理咨询师」式的被动倾听，不刻意追问三问。
// ============================================================

/** 一条对话消息 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/** 对话请求体（携带完整历史 + 纸条上下文，后端无状态） */
export interface ChatRequest {
  messages: ChatMessage[];
  /** 用户在打字机纸条上写的「今天发生了什么」，作为聊天背景 */
  context?: string;
  /** 开场模式：messages 可为空，让 AI 基于 context 主动说第一句 */
  opening?: boolean;
}

/** 对话响应体 */
export interface ChatResponse {
  reply: string;
}

/** 对话总结请求体 */
export interface ChatSummaryRequest {
  messages: ChatMessage[];
  /** 纸条上的「今天发生了什么」，总结时 content 直接用它（不靠 AI 归纳） */
  context?: string;
}

/** 对话总结响应体：AI 从整段对话归纳出的草稿（未提及的字段留空，不编造） */
export interface ChatSummaryResponse {
  emotion: EmotionKey;
  content: string;
  lesson: string;
  next_action: string;
  growth_evidence: string;
  /** 四个指数（LLM 直接产出；无 AI 降级时由本地规则版计算） */
  scores?: Scores;
  /** 评分来源（llm=AI 打分 / rule=规则估算） */
  score_source?: ScoreSource;
  /** 每个指数的理由（LLM 打分时给出） */
  score_reasons?: ScoreReasons;
  /** AI 复盘共情回应（LLM 产出；降级时为本地模板） */
  ai_response?: string;
  /** 是否为本地规则降级结果（AI 不可用时为 true） */
  fallback?: boolean;
}

// ============================================================
// 聊天内容回溯（保存的聊天记录）
// ============================================================

/** 一条保存的聊天记录（完整） */
export interface ChatRecord {
  id: string;
  /** ISO 8601 */
  created_at: string;
  /** 完整对话 */
  messages: ChatMessage[];
  /** 纸条上下文（「今天发生了什么」） */
  context?: string;
  /** 总结时识别到的情绪（可能为空） */
  emotion?: EmotionKey | null;
  /** 总结时的内容概括 */
  content?: string;
}

/** 聊天列表摘要（GET /api/chats 返回，不含完整 messages） */
export interface ChatListItem {
  id: string;
  created_at: string;
  /** 预览：第一条用户消息的截断 */
  preview: string;
  emotion: EmotionKey | null;
  message_count: number;
}

/** 保存 / 更新一段聊天记录的请求体（POST /api/chats，PATCH /api/chats/:id） */
export interface SaveChatInput {
  messages: ChatMessage[];
  context?: string;
  emotion?: EmotionKey | null;
  content?: string;
}

// ============================================================
// 个人全方面分析（纸堆 + 聊天记录）
// ============================================================

/** 聊天里的情绪分布 */
export interface ChatEmotionCount {
  emotion: EmotionKey;
  count: number;
}

/** 全方面分析响应体（GET /api/analytics/overview） */
export interface OverviewAnalysis {
  /** 纸堆（日记）总条数 */
  entry_count: number;
  /** 已做三问复盘的条数 */
  reflected_count: number;
  /** 聊天记录条数 */
  chat_count: number;
  /** 动态发现（能力标签 + 一句观察，≤3） */
  strengths: StrengthInsight[];
  /** 过去 → 现在的行为模式变化（≤3） */
  patterns: PatternShift[];
  /** 正在形成的能力标签 */
  growth_areas: string[];
  /** 聊天情绪分布（按出现次数降序） */
  chat_emotions: ChatEmotionCount[];
  /** 一句总述（规则生成） */
  summary: string;
}

// ============================================================
// 过往记录 / 我的韧性
// 列表接口只返回摘要（不含三问与 AI 回应），详情接口返回完整记录。
// ============================================================

/** 日记列表摘要（GET /api/diary 返回，不含 lesson/next_action/growth_evidence/ai_response） */
export interface DiarySummary {
  id: string;
  emotion: EmotionKey;
  content: string;
  resilience_score: number;
  /** 是否已做三问复盘（lesson/next_action/growth_evidence 任一非空） */
  has_reflection: boolean;
  created_at: string;
  /** 软删除时间（回收站列表用；非回收站记录为 null） */
  deleted_at?: string | null;
  source?: DiarySource;
  excluded_from_insights?: boolean;
  chat_id?: string | null;
}

/** 韧性变化点：一篇笔记一个点（刷新左栏时才重画） */
export interface GrowthPoint {
  /** YYYY-MM-DD */
  date: string;
  score: number;
  /** 对应笔记 id（同一天多篇时用来区分） */
  id?: string;
  /** 是否做过三问复盘（历史兼容；左栏快照里每篇都画实心点） */
  reflected?: boolean;
}

/** 左栏画像 / 折线快照：只在 7 的倍数或手动刷新时重算 */
export interface InsightsSnapshot {
  included_ids: string[];
  included_count: number;
  computed_at: string;
  profile: GrowthProfile;
  growth: GrowthPoint[];
}

/** GET /api/analytics/insights */
export interface InsightsResponse {
  snapshot: InsightsSnapshot | null;
  pending_count: number;
  countable_count: number;
}

export interface GrowthResponse {
  items: GrowthPoint[];
}

/** 情绪变化点（GET /api/analytics/emotions，最近 30 天） */
export interface EmotionPoint {
  /** YYYY-MM-DD */
  date: string;
  emotion: EmotionKey;
}

export interface EmotionsResponse {
  items: EmotionPoint[];
}

// ============================================================
// 我的成长画像（GET /api/analytics/growth-profile）
//
// 不是「人格测试」，而是 AI 看过用户的历史日记后，
// 自动总结出的「正在发生的变化」。
// 真实历史行为是主要依据；MBTI 只是初始信息，不体现在这里。
// ============================================================

/** AI 动态发现（顶部画像，3 个以内）：一个能力标签 + 一句观察 */
export interface StrengthInsight {
  /** 能力标签，如「自我觉察」「抗拒绝」 */
  label: string;
  /** AI 的一句观察，如「你越来越能区分事实和自己的评价。」 */
  note: string;
}

/** 一条正在改变的行为模式：过去 vs 现在 */
export interface PatternShift {
  /** 触发场景，如「被否定」 */
  trigger: string;
  /** 过去的反应链条（按顺序） */
  before: string[];
  /** 现在的反应链条（按顺序） */
  after: string[];
  /** 一句总结 */
  summary: string;
}

/** 成长画像响应体 */
export interface GrowthProfile {
  /** AI 动态发现（3 个以内） */
  strengths: StrengthInsight[];
  /** 正在改变的行为模式（1-3 个） */
  patterns: PatternShift[];
  /** 正在形成/增强的能力标签 */
  growth_areas: string[];
  /** 沟通风格（来自 support_preference，弱上下文；可为空） */
  communication_style: string;
}

// ============================================================
// 用户初始画像（Onboarding）
// 契约：GET /api/profile（未完成返回 404）、POST /api/profile
// 只是 AI 冷启动的上下文参考，允许为空、可跳过。
// ============================================================

/** 人生阶段 */
export type LifeStageKey =
  | "high_school"
  | "university"
  | "early_career"
  | "career_growth"
  | "freelance"
  | "other";

/** 16 种 MBTI */
export type MbtiKey =
  | "INTJ"
  | "INTP"
  | "ENTJ"
  | "ENTP"
  | "INFJ"
  | "INFP"
  | "ENFJ"
  | "ENFP"
  | "ISTJ"
  | "ISFJ"
  | "ESTJ"
  | "ESFJ"
  | "ISTP"
  | "ISFP"
  | "ESTP"
  | "ESFP";

/** 希望被陪伴的方式 */
export type SupportPreferenceKey =
  | "listen_first"
  | "analyze"
  | "solve"
  | "listen_then_reflect";

export interface UserProfile {
  mbti: MbtiKey | null;
  life_stage: LifeStageKey | null;
  support_preference: SupportPreferenceKey | null;
}
