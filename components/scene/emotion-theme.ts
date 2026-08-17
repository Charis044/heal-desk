export const EMOTION_THEMES = {
  sad: {
    label: "悲伤",
    color: "#084973",
    glow: "rgba(8, 73, 115, 0.72)",
    message: "呜哇哇哇哇哇～",
  },
  angry: {
    label: "愤怒",
    color: "#DA0D1E",
    glow: "rgba(218, 13, 30, 0.72)",
    message: "卧槽！你开玩笑吗？？！",
  },
  anxious: {
    label: "焦虑",
    color: "#F3620F",
    glow: "rgba(243, 98, 15, 0.72)",
    message: "哎呀呀，怎么办呀！",
  },
  tired: {
    label: "疲惫",
    color: "#67944B",
    glow: "rgba(103, 148, 75, 0.72)",
    message: "唉。累。懒得。动。唉。",
  },
  lost: {
    label: "迷茫",
    color: "#078D8C",
    glow: "rgba(7, 141, 140, 0.72)",
    message: "Me? Who? 马什么梅？",
  },
  calm: {
    label: "平静",
    color: "#E8EDF2",
    glow: "rgba(232, 237, 242, 0.78)",
    message: "Peach and lava~ 🤓",
  },
  happy: {
    label: "开心",
    color: "#F5B301",
    glow: "rgba(245, 179, 1, 0.72)",
    message: "happy happy happy~~~",
  },
  excited: {
    label: "兴奋",
    color: "#E8493D",
    glow: "rgba(232, 73, 61, 0.72)",
    message: "诶嘿嘿？？嘿嘿嘿嘿",
  },
  moved: {
    label: "感动",
    color: "#D6789A",
    glow: "rgba(214, 120, 154, 0.72)",
    message: "💜❤️😍？😭😭😭",
  },
  hopeful: {
    label: "充满希望",
    color: "#58B368",
    glow: "rgba(88, 179, 104, 0.72)",
    message: "你相信光吗？",
  },
  grateful: {
    label: "感激",
    color: "#E8894E",
    glow: "rgba(232, 137, 78, 0.72)",
    message: "Reallllly appreciate it! 💖",
  },
  content: {
    label: "满足",
    color: "#7FB3A3",
    glow: "rgba(127, 179, 163, 0.72)",
    message: "Nyheaaaa~",
  },
} as const

export type EmotionId = keyof typeof EMOTION_THEMES

export const EMOTION_ORDER = [
  "sad",
  "angry",
  "anxious",
  "tired",
  "lost",
  "calm",
  "happy",
  "excited",
  "moved",
  "hopeful",
  "grateful",
  "content",
] as const satisfies readonly EmotionId[]
