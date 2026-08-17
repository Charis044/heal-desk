export default function AiAnalysisPlaceholder() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-[#141021] px-6 text-[#fff8ee]">
      <section className="max-w-md text-center font-serif">
        <p className="text-sm tracking-[0.24em] text-[#f0c48f]">
          AI 心理分析
        </p>
        <h1 className="mt-4 text-3xl font-medium tracking-wide">
          小熊正在准备倾听
        </h1>
        <p className="mt-4 text-base leading-8 text-[#fff8ee]/75">
          这里已为后续的 AI 心理分析体验预留。未来可以接入对话、情绪总结和个性化建议。
        </p>
        <a
          href="/"
          className="mt-8 inline-block rounded-full border border-white/25 px-5 py-2.5 text-sm text-[#fff8ee]/90 transition-colors hover:border-white/45 hover:text-white"
        >
          返回桌面
        </a>
      </section>
    </main>
  )
}
