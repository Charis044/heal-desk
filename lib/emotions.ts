import type { EmotionGroup, EmotionKey } from "./types";

export interface EmotionDef {
  key: EmotionKey;
  label: string;
  color: string;
  hint: string;
  group: EmotionGroup;
}

/**
 * 12 种情绪。
 *
 * 设计原则：情绪没有「好坏」之分，负面情绪不比积极情绪低级，
 * 只是记录一个人生活中的完整情绪轨迹。
 */
export const EMOTIONS: EmotionDef[] = [
  // 负面 / 困扰
  { key: "sad", label: "悲伤", color: "#084973", hint: "让眼泪流出来也没关系", group: "negative" },
  { key: "angry", label: "愤怒", color: "#DA0D1E", hint: "生气，说明你在乎", group: "negative" },
  { key: "anxious", label: "焦虑", color: "#F3620F", hint: "担心，是准备的一部分", group: "negative" },
  { key: "tired", label: "疲惫", color: "#67944B", hint: "累了，就慢一点", group: "negative" },
  { key: "confused", label: "迷茫", color: "#078D8C", hint: "看不清方向是暂时的", group: "negative" },
  // 中性 / 稳定
  { key: "calm", label: "平静", color: "#FFC20A", hint: "安静，也是一种力量", group: "neutral" },
  // 积极 / 明亮
  { key: "happy", label: "开心", color: "#F5B301", hint: "开心，就让它自然发生", group: "positive" },
  { key: "excited", label: "兴奋", color: "#E8493D", hint: "那股兴奋劲儿，值得被记住", group: "positive" },
  { key: "moved", label: "感动", color: "#D6789A", hint: "被触动，是很珍贵的", group: "positive" },
  { key: "hopeful", label: "充满希望", color: "#58B368", hint: "心里有光，就很好", group: "positive" },
  { key: "grateful", label: "感激", color: "#E8894E", hint: "谢谢，是一份暖意", group: "positive" },
  { key: "content", label: "满足", color: "#7FB3A3", hint: "觉得够了，是一种踏实", group: "positive" },
];

const EMOTION_MAP = Object.fromEntries(
  EMOTIONS.map((e) => [e.key, e])
) as Record<EmotionKey, EmotionDef>;

export function getEmotion(key: EmotionKey): EmotionDef {
  return EMOTION_MAP[key] ?? EMOTIONS[5];
}

/** 按分组筛选情绪（供情绪选择卡分组展示） */
export function emotionsByGroup(group: EmotionGroup): EmotionDef[] {
  return EMOTIONS.filter((e) => e.group === group);
}
