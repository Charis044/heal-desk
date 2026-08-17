import type {
  LifeStageKey,
  MbtiKey,
  SupportPreferenceKey,
} from "./types";

/** Onboarding 选项定义（仅前端展示用，后端只存 key） */

export interface Option<T> {
  key: T;
  label: string;
  emoji?: string;
}

export const LIFE_STAGE_OPTIONS: Option<LifeStageKey>[] = [
  { key: "high_school", label: "高中" },
  { key: "university", label: "大学" },
  { key: "early_career", label: "初入职场" },
  { key: "career_growth", label: "职业发展期" },
  { key: "freelance", label: "自由职业 / 创业" },
  { key: "other", label: "其他" },
];

export const MBTI_OPTIONS: MbtiKey[] = [
  "INTJ",
  "INTP",
  "ENTJ",
  "ENTP",
  "INFJ",
  "INFP",
  "ENFJ",
  "ENFP",
  "ISTJ",
  "ISFJ",
  "ESTJ",
  "ESFJ",
  "ISTP",
  "ISFP",
  "ESTP",
  "ESFP",
];

export const SUPPORT_OPTIONS: Option<SupportPreferenceKey>[] = [
  { key: "listen_first", label: "先听我说", emoji: "🫂" },
  { key: "analyze", label: "帮我分析", emoji: "🔍" },
  { key: "solve", label: "帮我解决", emoji: "⚡" },
  { key: "listen_then_reflect", label: "先倾听，再一起复盘", emoji: "🌱" },
];
