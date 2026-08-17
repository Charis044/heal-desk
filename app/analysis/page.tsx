import type { Metadata } from "next"
import { AnalysisPage } from "@/components/analysis/analysis-page"

export const metadata: Metadata = {
  title: "我的变化 · 韧芽",
  description: "回看近期的情绪线索、行为变化与韧性轨迹。",
}

export default function Page() {
  return <AnalysisPage />
}
