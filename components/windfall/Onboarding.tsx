"use client";

import {
  LIFE_STAGE_OPTIONS,
  MBTI_OPTIONS,
  SUPPORT_OPTIONS,
} from "@/lib/onboarding";
import type {
  LifeStageKey,
  MbtiKey,
  SupportPreferenceKey,
  UserProfile,
} from "@/lib/types";
import { NightAtmosphere } from "@/components/ui-layer/night-atmosphere";
import { useEffect, useState } from "react";

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
}

/**
 * 首次进入的 3 步画像（Onboarding）。
 * 像一次简单的见面，不是注册问卷；可跳过、允许为空。
 * MBTI 只作 AI 冷启动参考，绝不在这里做人格定性。
 */
export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0); // 0..2 三步，3 完成屏
  const [profile, setProfile] = useState<UserProfile>({
    mbti: null,
    life_stage: null,
    support_preference: null,
  });

  // 完成屏停留后自动进入
  useEffect(() => {
    if (step !== 3) return;
    const t = setTimeout(() => onComplete(profile), 2000);
    return () => clearTimeout(t);
  }, [step, profile, onComplete]);

  const setLifeStage = (v: LifeStageKey | null) => {
    setProfile((p) => ({ ...p, life_stage: v }));
    setStep(1);
  };
  const setMbti = (v: MbtiKey | null) => {
    setProfile((p) => ({ ...p, mbti: v }));
    setStep(2);
  };
  const setSupport = (v: SupportPreferenceKey | null) => {
    setProfile((p) => ({ ...p, support_preference: v }));
    setStep(3);
  };

  if (step === 3) {
    return (
      <div className="ob">
        <NightAtmosphere intensity="overlay" />
        <div className="ob-inner ob-done">
          <p className="ob-eyebrow">PING-I-CABIN</p>
          <h2 className="ob-done-title">好了，我大概认识你了。</h2>
          <p className="ob-done-sub">接下来的日子，慢慢写，慢慢来。</p>
        </div>
      </div>
    );
  }

  const progress = `${String(step + 1).padStart(2, "0")} / 03`;

  return (
    <div className="ob">
      <NightAtmosphere intensity="overlay" />
      <div className="ob-inner">
        <p className="ob-eyebrow">PING-I-CABIN</p>
        <p className="ob-intro">第一次见面，让我简单认识一下你。</p>
        <div className="ob-progress">{progress}</div>

        <div className="ob-step" key={step}>
          {step === 0 && (
            <>
              <h2 className="ob-title">你现在处于什么阶段？</h2>
              <div className="ob-options">
                {LIFE_STAGE_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    className="ob-option"
                    onClick={() => setLifeStage(o.key)}
                  >
                    {o.label}
                  </button>
                ))}
                <button
                  className="ob-option skip"
                  onClick={() => setLifeStage(null)}
                >
                  不想填写
                </button>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <h2 className="ob-title">你知道自己的 MBTI 吗？</h2>
              <p className="ob-hint">只是让我更了解你的一个小参考，选或不选都可以。</p>
              <div className="ob-mbti-grid">
                {MBTI_OPTIONS.map((m) => (
                  <button key={m} className="ob-mbti" onClick={() => setMbti(m)}>
                    {m}
                  </button>
                ))}
              </div>
              <div className="ob-options row">
                <button className="ob-option skip" onClick={() => setMbti(null)}>
                  不知道
                </button>
                <button className="ob-option skip" onClick={() => setMbti(null)}>
                  不想填写
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="ob-title">
                当你遇到困难时，你希望我怎么陪你？
              </h2>
              <div className="ob-support-grid">
                {SUPPORT_OPTIONS.map((o) => (
                  <button
                    key={o.key}
                    className="ob-support"
                    onClick={() => setSupport(o.key)}
                  >
                    <span className="ob-support-emoji">{o.emoji}</span>
                    <span className="ob-support-label">{o.label}</span>
                  </button>
                ))}
              </div>
              <button className="ob-skip-link" onClick={() => setSupport(null)}>
                先不选，直接开始
              </button>
            </>
          )}
        </div>

        {step > 0 && (
          <button className="ob-back" onClick={() => setStep((s) => s - 1)}>
            上一题
          </button>
        )}
      </div>
    </div>
  );
}
