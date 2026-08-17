import type { GrowthProfile } from "@/lib/types";

interface GrowthProfileProps {
  profile: GrowthProfile | null;
  loading: boolean;
}

/**
 * 「我的韧性画像」：AI 看过历史日记后，自动总结的「正在发生的变化」。
 *
 * 不是人格测试、不是成长树、不是 Dashboard。
 * 只是帮助用户「翻开过去保存下来的自己，看看自己什么时候开始变得不一样」。
 */
export default function GrowthProfileView({
  profile,
  loading,
}: GrowthProfileProps) {
  if (loading) {
    return (
      <section className="mt-10">
        <h2 className="section-title">我的韧性画像</h2>
        <div className="paper-card mt-6 rounded-xl p-6 text-center text-[0.9rem] text-[#9a8b78]">
          正在翻看你写下的这些日子……
        </div>
      </section>
    );
  }

  if (!profile) {
    return null;
  }

  const empty =
    profile.strengths.length === 0 && profile.patterns.length === 0;

  return (
    <section className="mt-10">
      <h2 className="section-title">我的韧性画像</h2>
      <p className="mt-2 text-[0.9rem] text-[#8a7156]">
        最近的你，正在发生什么变化？
      </p>

      {empty && (
        <div className="paper-card mt-5 rounded-xl p-8 text-center text-[0.9rem] text-[#9a8b78]">
          记录得多了，这里会慢慢显出你自己都没注意到的变化。
        </div>
      )}

      {/* AI 动态发现（3 个以内） */}
      {profile.strengths.length > 0 && (
        <div className="mt-5 space-y-3">
          {profile.strengths.map((s) => (
            <div key={s.label} className="paper-card gprof-insight rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="gprof-dna" aria-hidden>
                  🧬
                </span>
                <div>
                  <p className="gprof-label">{s.label}</p>
                  <p className="mt-1 text-[0.95rem] leading-relaxed text-[#3b3028]">
                    {s.note}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 正在形成的能力标签 */}
      {profile.growth_areas.length > 0 && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-[0.78rem] font-semibold text-[#a88a63]">
            正在形成的能力
          </span>
          {profile.growth_areas.map((a) => (
            <span key={a} className="gprof-chip">
              🧬 {a}
            </span>
          ))}
        </div>
      )}

      {/* 我的行为模式（过去 → 现在） */}
      {profile.patterns.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[0.95rem] font-bold text-[#5a4030]">
            你正在改变的地方
          </h3>

          <div className="mt-4 space-y-4">
            {profile.patterns.map((p, i) => (
              <div key={i} className="paper-card rounded-xl p-5">
                <p className="gprof-trigger">{p.trigger}</p>

                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="gprof-phase gprof-past">过去</p>
                    <ul className="mt-1.5 space-y-1">
                      {p.before.map((step, j) => (
                        <li key={j} className="gprof-step">
                          <span className="gprof-step-node" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="gprof-phase gprof-now">现在</p>
                    <ul className="mt-1.5 space-y-1">
                      {p.after.map((step, j) => (
                        <li key={j} className="gprof-step">
                          <span className="gprof-step-node gprof-step-node-now" />
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <p className="mt-4 border-t border-[rgba(90,61,43,0.12)] pt-3 text-[0.9rem] leading-relaxed text-[#5a4030]">
                  {p.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
