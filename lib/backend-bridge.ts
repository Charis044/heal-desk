import type { EmotionId } from "@/components/scene/emotion-theme"
import { toBackendEmotion } from "./emotion-map"

/**
 * 前端打字机记录 → 后端日记仓的「尽力而为」同步。
 *
 * 设计取舍（前端为主导）：
 * - 前端场景/归档仍以 localStorage（journal-record）为唯一主数据源，交互与展示不变。
 * - 这里只把内容「镜像」到后端 /api/diary，让「成长分析」页能读到真实记录、
 *   并在后端计算出韧性指数 / AI 回应 / 成长画像。
 * - 后端不可用（未部署 / 报错）时静默失败，绝不影响前端书写体验。
 *
 * 已知限制（v1）：编辑一条旧记录会再次 POST 一条新记录（后端侧产生一条重复镜像），
 * 而非 PATCH 更新。对「成长分析」的统计影响可控；后续可在 JournalRecord 上挂 backendId
 * 改成 PATCH 更新。
 */
export async function syncJournalToBackend(
  pages: string[],
  emotion: EmotionId,
): Promise<void> {
  try {
    const content = pages.join("\n").trim()
    if (!content) return

    await fetch("/api/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        emotion: toBackendEmotion(emotion),
        content,
        lesson: "",
        next_action: "",
        growth_evidence: "",
        source: "handwritten",
      }),
    })
  } catch {
    // 静默失败：分析页对空/失败有自己的空态兜底
  }
}